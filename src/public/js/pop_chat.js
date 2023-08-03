const frontSocket = io(); // io 함수는 알아서 socket.io를 실행하고 서버를 찾습니다.

const $chat_leave = document.getElementById("chat_leave");
const $chat_leave_btn = $chat_leave.querySelector(".chat_leave_btn"); // 나가기 버튼

const $chat = document.getElementById("chat"); // 전체 div 채팅창 선택
const $chat_1 = $chat.querySelector(".chat_1"); // 접근 1
const $chat_main = $chat_1.querySelector(".chat_main"); // 접근 2
const $c_roomname = $chat_main.querySelector(".c_roomname"); // 방 이름으로 접근
const $c_roomname_1 = $c_roomname.querySelector(".c_roomname_1"); // 방 이름을 접근 2

const $c_main_content = $chat_main.querySelector(".c_main_content"); // 채팅 내용이 들어갈 곳

const $c_chatting = $chat_main.querySelector(".c_chatting"); // 채팅작성 및 전송
const $c_chatting_form = $c_chatting.querySelector(".c_chatting_form"); // 채팅 작성 form
const $form_input = $c_chatting_form.querySelector("#form_input"); // 채팅 작성 form의 input
const roomName = localStorage.getItem("roomName"); // localStorage에서 방 이름을 가져오기
let nickname = localStorage.getItem("nickname"); // localStorage에서 닉네임을 가져오기

// 1. 팝업창 열기
$(document).on("click", ".chat_open", (e) => {
  console.log("팝업창 열기");
  $("#chat").css("display", "block");
});

// 1. 팝업창 닫기
$(document).on("click", ".c_content_close button", (e) => {
  console.log("팝업창 닫기");
  $("#chat").css("display", "none");
});

// 2. chat 축소판 다시 열기
$(document).on("click", ".c_content_mini_btn", (e) => {
  console.log("팝업창 키우기");
  $("#chat_mini").css("display", "flex");
  $("#chat").css("display", "none");
});

// 2. chat 축소판 닫기
$(document).on("click", ".chat_mini_1_2btn", (e) => {
  console.log("팝업창 줄이기");
  $("#chat_mini").css("display", "none");
  $("#chat").css("display", "block");
});

// 움직이는 모달
$(document).on("ready", () => {
  //모달 움직이게 하려면, draggable(); 하면 된다.
  $("#c_content_move button").draggable();
});

// 프론트로 온 이벤트 감지
frontSocket.onAny((event) => {
  console.log(`frontSocket Event: ${event}`);
});

const addNotice = (message) => {
  console.log("addNotice 함수 실행");
  const $div = document.createElement("div");
  console.log("message : ", message);
  $div.textContent = message;
  $c_main_content.appendChild($div);
};

const addMessage = (nickname, message) => {
  const $div = document.createElement("div");
  $div.textContent = `${nickname} : ${message}`;
  $c_main_content.appendChild($div);
};

// 방 떠나기 함수
const handleLeaveRoom = () => {
  frontSocket.emit("leave_room", { room_name: roomName, nickname: nickname });
  const newUrl = `${window.location.origin}/home`;
  window.location.href = newUrl; // 나갈 때 방 입장 전 페이지로 이동
};

frontSocket.on("hi", ({ room_name, nickname }) => {
  console.log("프론트 hi이벤트 옴");
  // $user_count.textContent = `${user_count}명`;
  addNotice(`${nickname}(이)가 ${room_name} 방에 입장했습니다.`);
  // setUserCount(user_count);
});

frontSocket.on("bye", ({ room_name, nickname }) => {
  console.log("프론트 bye이벤트 옴");
  console.log(`${nickname}은 ${room_name} 방을 나갔습니다. `);
  addNotice(`${nickname}(이)가 ${room_name} 방에서 나갔습니다.`);
  // window.location.href를 사용하여 다른 페이지로 리디렉션할 수 있습니다.
  // 예: window.location.href = "/room_input_page";
});

const handleMessageSubmit = (event) => {
  event.preventDefault();
  const message = $form_input.value; // 메시지 입력값 가져오기
  console.log("메세지 핸들러, 메세지 : ", message);

  // 메시지 전송
  // console.log(typeof(frontSocket)) // object
  frontSocket.emit("new_message", { message, roomName, nickname }, () => {
    addMessage(nickname, message);
  });
  $c_main_content.value = ""; // 입력 창 초기화
};

frontSocket.on("new_message", ({ nickname, message }) => {
  addMessage(nickname, message);
});

$c_chatting_form.addEventListener("submit", handleMessageSubmit);
$chat_leave_btn.addEventListener("click", handleLeaveRoom);
