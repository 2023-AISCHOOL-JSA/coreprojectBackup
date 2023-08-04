// nameSpace를 이용해서 코드 채팅방, 게임 채팅방 구현하기
const express = require("express");
const app = express();
const http = require("http").createServer(app)
const io = require("socket.io")(http);
const path = require("path");
const mime = require("mime");

const page = require("./router/page");
app.use(page);

const chatNamespace = io.of("/chat");
const gameNamespace = io.of("/game");

app.set("view engine", "html");

const nunjucks = require("nunjucks")
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
// 함수 정의
// 방의 인원수를 세는 함수
const countRoomUsers = (room_name) => {
    return io.sockets.adapter.rooms.get(room_name)?.size;
  };

// 함수 정의 끝
// "Chat" namespace에 접속한 클라이언트 처리
chatNamespace.on("connection", (socket) => {
    console.log("Chat 네임스페이스에 클라이언트가 연결되었습니다.");
    // 닉네임 설정 받고 다시 보내기
    socket.on("nickname", (nickname) => {
        console.log("서버 nickname 이벤트 활성화");
        console.log("사용자의 닉네임 : ", nickname);
        socket["nickname"] = nickname; // 소켓 객체에 "nickname"이라는 속성 추가
        io.to(socket.id).emit("nickname", {nickname})
    });

    // 방 입장 enter_room 감지하기
    socket.on("enter_room", ({room_name, nickname}) => {
        console.log("서버 enter_room 이벤트 활성화");
        console.log("enter_room의 room_name", room_name);
        console.log("enter_room의 nickname", nickname);

        socket["room_name"] = room_name; // 소캣 객체에 "room_name"이라는 속성 추가

        socket.join(room_name) // 방에 입장하기
        // const user_count = countRoomUsers(room_name);
    });

    socket.on("disconnecting", () => {
        console.log("서버 disconnecting 이벤트 활성화");
    })

    socket.on("disconnet", () => {
        console.log("서버 disconnect 이벤트 활성화");
    })
});



// "Game" namespace에 접속한 클라이언트 처리
gameNamespace.on("connection", (socket) => {
    console.log("Game 네임스페이스에 클라이언트가 연결되었습니다.");
    // 닉네임 설정 받고 다시 보내기
    socket.on("nickname", (nickname) => {
        console.log("서버 nickname 이벤트 활성화");
        console.log("사용자의 닉네임 : ", nickname);
        socket["nickname"] = nickname; // 소켓 객체에 "nickname"이라는 속성 추가
        io.to(socket.id).emit("nickname", {nickname})
    });

    socket.on("enter_room", ({room_name, nickname}) => {
        console.log("서버 enter_room 이벤트 활성화");
        console.log("enter_room의 room_name", room_name);
        console.log("enter_room의 nickname", nickname);

    })
})









const handleListen = () =>
  console.log("Listeing on http://localhost:3005");
http.listen(3005, handleListen);