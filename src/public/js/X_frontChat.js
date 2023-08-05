const frontSocket = io(); // io 함수는 알아서 socket.io를 실행하고 서버를 찾습니다.

const $room = document.getElementById("room");
const $room_name = $room.querySelector("#room_name");
const $user_count = $room.querySelector("#user_count");
const $ul = $room.querySelector("ul");
const $message_form = $room.querySelector("#message");
const $message_input = $message_form.querySelector("input");

const roomName = localStorage.getItem("roomName"); // localStorage에서 방 이름을 가져오기
let nickname = localStorage.getItem("nickname"); // localStorage에서 닉네임을 가져오기

const addMessage = (nickname, message) => {
  const $li = document.createElement("li");
  $li.textContent = `${nickname} : ${message}`;
  $ul.appendChild($li);
};

const addNotice = (message) => {
  //공지
  const $ul = $room.querySelector("ul");
  const $li = document.createElement("li");
  console.log("message : ", message);
  $li.textContent = message;
  $ul.appendChild($li);
};


const handleMessageSubmit = (event) => {
  event.preventDefault();
  const message = $message_input.value; // 메시지 입력값 가져오기
  console.log("메세지 핸들러");

  // 메시지 전송
  console.log(typeof(frontSocket))
  frontSocket.to(roomName).emit("new_message", { message, roomName, nickname }, () => {
    addMessage(nickname, message);
    $message_input.value = ""; // 입력 창 초기화
  });
};

$message_form.addEventListener("submit", handleMessageSubmit);


frontSocket.on("welcome", ({ nickname, user_count }) => {
  console.log("프론트 welcome이벤트 옴");
  const roomName = localStorage.getItem("roomName")
  const storedNickname = localStorage.getItem("nickname")
  console.log(roomName);
  console.log(storedNickname);

  $room_name.textContent = `Room ${roomName}`;
  $user_count.textContent = `${user_count}명`;
  addNotice(`${storedNickname}(이)가 방에 입장했습니다.`);
  setUserCount(user_count);
});

frontSocket.on("bye", ({ nickname, user_count }) => {
  $user_count.textContent = `${user_count}명`;
  addNotice(`${nickname}(이)가 방에서 퇴장했습니다.`);
  setUserCount(user_count);
});

frontSocket.on("new_message", ({ nickname, message }) => {
  addMessage(nickname, message);
});

frontSocket.on("disconnect", () => console.log("disconnect to server"));
