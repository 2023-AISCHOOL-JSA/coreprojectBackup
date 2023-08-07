// nameSpace를 이용해서 코드 채팅방, 게임 채팅방 구현하기
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const mime = require("mime");

const page = require("./router/page");
app.use(page);

// 네임스페이스로 io 서버 분리 /CodeChat, /CodeArena
const ChatNamespace = io.of("/CodeChat");
const ArenaNamespace = io.of("/CodeArena");

app.set("view engine", "html");

const nunjucks = require("nunjucks");
nunjucks.configure("src/views", {
  express: app,
  watch: true,
});

app.set("views", __dirname + "/views");
app.use("/public", express.static(path.join(__dirname, "public")));

// 네임스페이스 사용했기 때문에 파일 경로 지정
app.use(
  "/CodeChat/public/CodeChat",
  express.static(path.join(__dirname, "public/CodeChat"), {
    setHeaders: (res, filePath) => {
      const mimeType = mime.getType(filePath);
      res.setHeader("Content-Type", mimeType);
    },
  })
);

// 네임스페이스 사용했기 때문에 파일 경로 지정
app.use(
  "/CodeArena/public/CodeArena",
  express.static(path.join(__dirname, "public/CodeArena"), {
    setHeaders: (res, filePath) => {
      const mimeType = mime.getType(filePath);
      res.setHeader("Content-Type", mimeType);
    },
  })
);

// "Chat" namespace에 접속한 클라이언트 처리
ChatNamespace.on("connection", (socket) => {
  const rooms = new Map(); // 방 정보를 저장할 Map
  const usedRoomNumbers = new Set(); // 사용된 방 번호를 저장하는 Set
  
  // 함수 정의
  // 방의 인원수를 세는 함수
  // const countRoomUsers = (room_name) => {
  //   return io.sockets.adapter.rooms.get(room_name)?.size;
  // };
  // 방 번호를 생성하는 함수
  const generateRoomNumber = () => {
    let room_number;
    do {
      room_number = Math.floor(Math.random() * 100) + 1; // 1부터 100 사이의 난수 생성
    } while (usedRoomNumbers.has(room_number)); // 중복되는 방 번호가 나오지 않도록 반복

    usedRoomNumbers.add(room_number); // 사용된 방 번호 Set에 추가
    return room_number;
  };

  // 방의 인원수를 세는 함수
  const countRoomUsers = (room_name) => {
    return io.of("/CodeChat").adapter.rooms.get(room_name)?.size || 0;
  };

  // 함수 정의 끝

  console.log("Chat 네임스페이스에 클라이언트가 연결되었습니다.");
  console.log("입장하기 전 소켓이 들어간 방", socket.rooms);
  socket.onAny((event) => {
    console.log(`backSocket Event: ${event}`);
  });
  // 닉네임 설정 받고 다시 보내기
  socket.on("nickname", (nickname) => {
    console.log("서버 nickname 이벤트 활성화");
    console.log("사용자의 닉네임 : ", nickname);
    socket["nickname"] = nickname; // 소켓 객체에 "nickname"이라는 속성 추가
    io.to(socket.id).emit("nickname", { nickname });
  });

  socket.on("create_room", ({ room_name, chatRoomMethod, dev_lang }) => {
    console.log("create_room 이벤트 서버로 도착");

    if (chatRoomMethod === "one_to_one") {
      chatRoomMethod = "1:1채팅";
    } else {
      chatRoomMethod = "오픈채팅";
    }
    console.log(chatRoomMethod);

    const roomInfo = {
      room_number: generateRoomNumber(),
      room_name: room_name,
      chatRoomMethod: chatRoomMethod,
      dev_lang: dev_lang,
      createdBy: socket.nickname,
      createdDate: new Date().toISOString().slice(0, 10),
    };

    rooms.set(room_name, roomInfo);
    // callback(rooms)
    // 새로운 방 정보를 클라이언트에게 전달
    const updateRooms = Array.from(rooms.values());
    io.of("/CodeChat").emit("update_room_list", updateRooms);
  });

  // 방 입장 enter_room 감지하기
  socket.on(
    "enter_room",
    ({
      room_name: room_name,
      nickname: nickname,
      chatRoomMethod: chatRoomMethod,
      dev_lang: dev_lang,
    }) => {
      console.log("서버 enter_room 이벤트 활성화");
      // console.log("enter_room의 room_name", room_name);
      // console.log("enter_room의 nickname", nickname);
      // console.log("enter_room의 chatRoomMethod", chatRoomMethod);
      // console.log("enter_room의 dev_lang", dev_lang);

      socket["room_name"] = room_name; // 소캣 객체에 "room_name"이라는 속성 추가

      socket.join(room_name); // 방에 입장하기
      console.log("입장한 후 소켓이 들어간 방", socket.rooms);
      const user_count = countRoomUsers(room_name);
      console.log(user_count);
      io.of("/CodeChat").to(room_name).emit("user_count", {user_count : user_count})
      socket.emit("welcome", {nickname : nickname})
    }
  );


  socket.on("disconnecting", () => {
    console.log("서버 disconnecting 이벤트 활성화");
    console.log("disconnecting 이후 ", socket.rooms);
  });

  socket.on("disconnect", () => {
    console.log("서버 disconnect 이벤트 활성화");
    console.log("disconnect 이후 ", socket.rooms);
  });

});

// -------------------------------------------------------- CodeArena 시작 ----------------------------------------------------------------------------------

// "Game" namespace에 접속한 클라이언트 처리
ArenaNamespace.on("connection", (socket) => {
  console.log("Game 네임스페이스에 클라이언트가 연결되었습니다.");

  const rooms = new Map(); // 방 정보를 저장할 Map
  const usedRoomNumbers = new Set(); // 사용된 방 번호를 저장하는 Set

  // 함수 정의
  // 방의 인원수를 세는 함수
  // const countRoomUsers = (room_name) => {
  //   return io.sockets.adapter.rooms.get(room_name)?.size;
  // };
  // 방 번호를 생성하는 함수
  const generateRoomNumber = () => {
    let room_number;
    do {
      room_number = Math.floor(Math.random() * 100) + 1; // 1부터 100 사이의 난수 생성
    } while (usedRoomNumbers.has(room_number)); // 중복되는 방 번호가 나오지 않도록 반복

    usedRoomNumbers.add(room_number); // 사용된 방 번호 Set에 추가
    return room_number;
  };

  // 방의 인원수를 세는 함수
  const countRoomUsers = (room_name) => {
    return io.of("/CodeArena").sockets.adapter.rooms.get(room_name)?.size || 0;
  };

  // 함수 정의 끝
  // 닉네임 설정 받고 다시 보내기
  socket.on("nickname", (nickname) => {
    console.log("서버 nickname 이벤트 활성화");
    console.log("사용자의 닉네임 : ", nickname);
    socket["nickname"] = nickname; // 소켓 객체에 "nickname"이라는 속성 추가
    io.to(socket.id).emit("nickname", { nickname });
  });

  socket.on("create_room", ({ room_name, chatRoomMethod, dev_lang }) => {
    console.log("create_room 이벤트 서버로 도착");

    if (chatRoomMethod === "one_to_one") {
      chatRoomMethod = "1:1채팅";
    } else {
      chatRoomMethod = "오픈채팅";
    }
    console.log(chatRoomMethod);

    const roomInfo = {
      room_number: generateRoomNumber(),
      room_name: room_name,
      chatRoomMethod: chatRoomMethod,
      dev_lang: dev_lang,
      createdBy: socket.nickname,
      createdDate: new Date().toISOString().slice(0, 10),
    };

    rooms.set(room_name, roomInfo);
    // callback(rooms)
    // 새로운 방 정보를 클라이언트에게 전달
    const updateRooms = Array.from(rooms.values());
    io.of("/CodeArena").emit("update_room_list", updateRooms);
  });

  // 방 입장 enter_room 감지하기
  socket.on(
    "enter_room",
    ({
      room_name: room_name,
      nickname: nickname,
      chatRoomMethod: chatRoomMethod,
      dev_lang: dev_lang,
    }) => {
      console.log("서버 enter_room 이벤트 활성화");
      // console.log("enter_room의 room_name", room_name);
      // console.log("enter_room의 nickname", nickname);
      // console.log("enter_room의 chatRoomMethod", chatRoomMethod);
      // console.log("enter_room의 dev_lang", dev_lang);
      room_name = socket.handshake.url.replace("/CodeChat/", "");

      socket["room_name"] = room_name; // 소캣 객체에 "room_name"이라는 속성 추가

      socket.join(room_name); // 방에 입장하기
      // const user_count = countRoomUsers(room_name);
    }
  );

  socket.on("disconnecting", () => {
    console.log("서버 disconnecting 이벤트 활성화");
  });

  socket.on("disconnet", () => {
    console.log("서버 disconnect 이벤트 활성화");
  });
});

const handleListen = () => console.log("Listeing on http://localhost:3005");
http.listen(3005, handleListen);
