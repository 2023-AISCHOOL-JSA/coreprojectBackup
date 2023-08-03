const express = require("express");
const app = express();
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { log } from "console";
const http = require("http");
const path = require("path");
const mime = require("mime");
// import WebSocket from "ws";

const page = require("./router/page");

const nunjucks = require("nunjucks");
app.set("view engine", "html");

nunjucks.configure("src/views", {
  express: app,
  watch: true,
});

app.set("views", __dirname + "/views");
app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
      const mimeType = mime.getType(filePath);
      res.setHeader("Content-Type", mimeType);
    },
  })
);

app.use("/home", page);

// app.get("/", (req, res) => res.render("home"));
// app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () =>
  console.log("Listeing on http://localhost:3005/home");

const server = http.createServer(app);

// https://admin.socket.io/#/
const io = new Server(server, {
  // path: "/",
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
});

// 퍼블릭룸 모으기
const publicRooms = () => {
  const { sids, rooms } = io.sockets.adapter;
  const public_rooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      public_rooms.push({
        room_name: key,
        user_count: countRoomUsers(key),
      });
    }
  });
  return public_rooms;
};

// 방에 있는 유저의 수를 세는 함수
// map의 퍼블릭 키(유저의 방)의 아이템은 유니크(중복x)하다
// 키의 set.size를 하면 유저의 수가 나온다.
// ? : 항상 roomName을 찾을 수도 있고 아닐 수도 있어서
const countRoomUsers = (room_name) => {
  return io.sockets.adapter.rooms.get(room_name)?.size;
};

// 방을 퇴장하는 함수
// const handleLeaveRoom = (backSocket) => {
//   backSocket.rooms.forEach((room_name) => {
//     backSocket.to(room_name).emit("bye", {
//       nickname: backSocket.nickname,
//       user_count: countRoomUsers(room_name) - 1,
//     });
//     backSocket.leave(room_name);
//   });
// };

// done 함수를 백엔드에서 실행하는 것이 아닌
// 프론트에서 실행하여 보안성을 높인다.
// 백에서 실행하면 누군가 악성코드를 백엔드에서 실행할 수 있기 때문
const rooms = new Set();

// 연결 됐을 때를 클라이언트에서 서버로 받았을 때
io.on("connection", (backSocket) => {
  backSocket.on("welcome", ({ room_name, nickname }) => {
    const user_count = countRoomUsers(room_name);
    console.log(
      `${nickname}님이 ${room_name} 방에 들어왔습니다. ${user_count}`
    );
    io.emit("hi", { room_name, nickname, user_count });
  });

  backSocket.on("leave_room", ({ room_name, nickname }) => {
    // 방 이름을 확인하고 필요한 처리를 수행
    const user_count = countRoomUsers(room_name);
    console.log(`${nickname}님이 ${room_name} 방에서 나갔습니다.`);
    // 방을 나가는 로직 등을 작성
    // const user_count = countRoomUsers(roomName)
    io.emit("bye", { room_name, nickname, user_count });

    // 클라이언트에게 방 정보를 전달
    // io.sockets.emit("current_rooms", { public_rooms: publicRooms() }); // 존재하는 채팅방 갱신
  });

  // backSocket["nickname"] = "익명의 누군가";
  // io.sockets.emit("current_rooms", { public_rooms: publicRooms() });
  //사용자가 소켓에 연결시, 현재 활성화되어있는 오픈채팅방의 정보를 보여준다.
  // console.log(typeof(backSocket))
  backSocket.on("nickname", (payload) => {
    const { nickname } = payload;
    console.log("nickname : ", nickname);
    backSocket["nickname"] = nickname;
    io.to(backSocket.id).emit("nickname", { nickname });
  });

  backSocket.onAny((event) => {
    console.log(`backSocket Event: ${event}`);
  });

  backSocket.on("new_message", ({ message, room_name, nickname }, done) => {
    console.log("new_message 이벤트가 서버로 옴");
    console.log("보낸 메세지 : ", message);
    console.log("backSocket.nickname : ", nickname);
    io.to(room_name).emit("new_message", { nickname: nickname, message });
    done();
  });

  // -----------------------방에 들어갈 때!--------------------------------
  backSocket.on("enter_room", ({ room_name, nickname }) => {
    console.log("서버로 온 방이름", room_name);
    console.log("서버로 온 닉네임", nickname);
    console.log("입장 전 backSocket.rooms : ", backSocket.rooms);

    backSocket.join(room_name); // 방 입장

    const user_count = countRoomUsers(room_name);
    // 클라이언트에게 방 정보를 전달
    console.log("io.sockets.rooms : ", io.sockets.adapter.rooms);
    console.log("io.sockets.sids : ", io.sockets.adapter.sids);

    console.log("입장 후 backSocket.rooms : ", backSocket.rooms);

    // console.log(countRoomUsers(room_name));

    console.log("enter_room이벤트로 받은 room_name : ", room_name);
    console.log("user_count : ", user_count);
    backSocket
      .to(room_name)
      .emit("welcome", backSocket.nickname, countRoomUsers(room_name));
    // io.sockets.emit("current_rooms", { public_rooms: publicRooms() }); // 존재하는 채팅방 갱신
  });
  // -----------------방에 들어갈 때 코드 종료 ----------------------

  // disconnecting : 방을 퇴장하기 직전
  backSocket.on("disconnecting", () => {
    const roomName = backSocket.room_name;
    const user_count = countRoomUsers(roomName);
    console.log("disconnecting 이벤트의 backSocket.rooms : ", backSocket.rooms);
    backSocket.rooms.forEach(
      (roomName) =>
        backSocket.to(roomName).emit("bye", { roomName, user_count }),
      countRoomUsers(roomName) - 1
    );
  });

  // disconnect 이벤트 발생 시 방 정보를 업데이트합니다.
  backSocket.on("disconnect", () => {
    // 사용자가 속한 방 이름을 가져옵니다.
    const roomName = backSocket.room_name;

    // 방에 사용자가 남아있는지 확인합니다.
    const roomUsers = countRoomUsers(roomName);
    if (roomUsers === 1) {
      // 방에 사용자가 없으면 방을 삭제합니다.
      rooms.delete(roomName);
    }

    // 사용자가 속한 방 정보를 삭제합니다.
    backSocket.leave(roomName);

    // 클라이언트에게 방 목록을 업데이트하라는 신호를 보냅니다.
    // io.sockets.emit("current_rooms", { public_rooms: publicRooms() });
  });
});

server.listen(3005, handleListen);
