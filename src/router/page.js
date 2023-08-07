// views 안에있는 html 파일끼리 페이지 이동이 되게끔 설정해주는 역할
const express = require("express");
const router = express.Router();
const path = require("path");

// http://localhost:3005
router.get("/", (req, res) => {
  res.render("main");
});

// 로그인, 회원가입 라우팅
router.get("/join", (req, res) => {
  res.render("join");
});

router.get("/CodeChat", (req, res) => {
  res.render("codeChatList");
});

router.get("/CodeArena", (req, res) => {
  res.render("codeArenaList");
});

// 방 입장 라우트
// router.get("/CodeChat/chatroom/:roomName", (req, res) => {
//   const roomName = req.params.roomName;
//   console.log(req.query);
//   // 여기서 방 이름을 이용하여 해당 방으로 입장하는 로직을 구현하면 됩니다.
//   // 예를 들어, 방이 존재하는지 확인하고, 존재한다면 해당 방으로 입장하도록 처리할 수 있습니다.
//   res.render("popCodeChat", { roomName });
// });

// router.get("/CodeArena/chatroom/:roomName", (req, res) => {
//   const roomName = req.params.roomName;
//   console.log(req.query);
//   // 여기서 방 이름을 이용하여 해당 방으로 입장하는 로직을 구현하면 됩니다.
//   // 예를 들어, 방이 존재하는지 확인하고, 존재한다면 해당 방으로 입장하도록 처리할 수 있습니다.
//   res.render("popArenaChat", { roomName });
// });

// router.get("/chatroom")
module.exports = router;
