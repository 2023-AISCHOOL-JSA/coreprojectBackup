const express = require("express");
const app = express();
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
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

app.use(page);

// app.get("/", (req, res) => res.render("home"));
// app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () =>
  console.log("Listeing on http://localhost:3005");

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
  return publicRooms;
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

// 연결 됐을 때를 클라이언트에서 서버로 받았을 때
io.on("connection", (backSocket) => {
  // console.log(`클라이언트 소켓이 접속되었습니다. Socket ID: ${backSocket.id}`);

  backSocket.on("leave_room", ({ room_name, nickname }) => {
    // 방 이름을 확인하고 필요한 처리를 수행
    const user_count = countRoomUsers(room_name);
    console.log(`${nickname}님이 ${room_name} 방에서 나갔습니다.`);
    // 방을 나가는 로직 등을 작성
    io.to(room_name).emit("bye", { room_name, nickname, user_count });

    // 모든 클라이언트에게 방 정보를 전달
    io.sockets.emit("room_change", publicRooms()); // 존재하는 채팅방 갱신
  });

  // backSocket["nickname"] = "익명의 누군가";
  io.sockets.emit("room_change", { public_rooms: publicRooms() });
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

  backSocket.on("new_message", ({ message, roomName, nickname}, done) => {
    console.log("new_message 이벤트가 서버로 옴");
    console.log("보낼 방 : ", roomName);
    console.log("보낸 메세지 : ", message);
    console.log("backSocket.nickname : ", nickname);
    console.log(backSocket.to(roomName).emit("new_message", { nickname, message }, done()));
    io.to(roomName).emit("new_message", { nickname, message }, done())
    // io.sockets.emit("new_message", { nickname, message }); // 보낸 사람도 메세지를 받음
  });

  // -----------------------방에 들어갈 때!--------------------------------
  backSocket.on("enter_room", ({ room_name, nickname}) => {
    console.log("서버로 온 방이름", room_name);
    console.log("서버로 온 닉네임", nickname);
    console.log("입장 전 backSocket.rooms : ", backSocket.rooms);
    backSocket.room_name = room_name

    backSocket.join(room_name); // 방 입장

    const user_count = countRoomUsers(room_name);
    io.to(room_name).emit("user_count", {room_name, user_count})
    
    console.log("io.sockets.rooms : ", io.sockets.adapter.rooms);
    console.log("io.sockets.sids : ", io.sockets.adapter.sids);
    console.log("입장 후 backSocket.rooms : ", backSocket.rooms);

    // console.log(countRoomUsers(room_name));
    console.log(`현재 방(${room_name})에 속한 사용자 수: ${countRoomUsers(room_name)}`);


    io.sockets.emit("room_change", publicRooms());
    // io.sockets.emit("room_change", { public_rooms: publicRooms() }); // 존재하는 채팅방 갱신
    console.log(user_count);
  });
  // -----------------방에 들어갈 때 코드 종료 ----------------------

  backSocket.on("welcome", ({ room_name, nickname }) => {
    const user_count = countRoomUsers(room_name);
    
    console.log(
      `${nickname}님이 ${room_name} 방에 들어왔습니다. ${user_count}`
      );
      io.to(room_name).emit("user_count", {room_name, user_count});
      io.to(room_name).emit("welcome", { nickname, user_count }); // 나를 제외한 방에 있는 다른 클라이언트
  });

  // disconnecting : 방을 퇴장하기 직전
  backSocket.on("disconnecting", () => {
    const roomName = backSocket.room_name;
    console.log("disconnecting 이벤트의 backSocket.rooms : ", backSocket.rooms);
    backSocket.to(roomName).emit("bye", backSocket.nickname, roomName, countRoomUsers(roomName) - 1)
  });
  
  // disconnect 이벤트 발생 시 방 정보를 업데이트합니다.
  backSocket.on("disconnect", () => {
  
    // 클라이언트에게 방 목록을 업데이트하라는 신호를 보냅니다.
    io.sockets.emit("room_change", publicRooms());
  });
});

server.listen(3005, handleListen);
