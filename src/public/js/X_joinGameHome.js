// 방의 이름을 입력받고 방에 입장할 수 있는 페이지 담당 js
const gameSocket = io("/game");

const $welcome = document.getElementById("welcome");
const $enter_form = $welcome.querySelector("#enter");
const $room_name_input = $enter_form.querySelector("#room_name_input");
const $name_form = $welcome.querySelector("#nickname");
const $public_room = document.querySelector("#public_room");

// 방 입장 함수
const handleRoomSubmit = (event) => {
  event.preventDefault();
  const room_name = $room_name_input.value;
  const $input = $welcome.querySelector("#nickname input").value
  let nickname = ""
  if ($input == ""){
    nickname = "익명"
  }
  else{
    nickname = $input
  }
  localStorage.setItem("roomName", room_name); // frontChat과 roomName을 공유하기위해서 localStorage에 저장
  localStorage.setItem("nickname", nickname); // frontChat과 roomName을 공유하기위해서 localStorage에 저장

  console.log("방 핸들 활성화");
  gameSocket.emit("enter_room", { room_name: room_name, nickname: nickname });
  gameSocket.emit("welcome", { room_name: room_name, nickname: nickname });
  const newUrl = `${window.location.origin}/game/gameroom/${encodeURIComponent(
    room_name
  )}`;
  window.location.href = newUrl;
};

// gameSocket.on("room_info", ({ room_name }) => {
//   // 채팅방으로 이동
//   const newUrl = `${window.location.origin}/home/room/${encodeURIComponent(room_name)}`;
//   window.location.href = newUrl;
// });

// 닉네임 설정 함수
const handleNicknameSubmit = (event) => {
  event.preventDefault();
  const $input = $welcome.querySelector("#nickname input");
  const nickname = $input.value;

  console.log(`닉네임 ${nickname}을 localStorage에 저장`);
  gameSocket.emit("nickname", { nickname }, () => {
    localStorage.setItem("nickname", nickname); // 설정한 닉네임을 localStorage에 저장
    $input.value = "";
  });
};

$enter_form.addEventListener("submit", handleRoomSubmit);
$name_form.addEventListener("submit", handleNicknameSubmit);

gameSocket.on("room_change", ({ publicRooms }) => {
  const $ul = $public_room.querySelector("ul");
  $ul.innerHTML = "";
  
  // if (rooms.length === 0 ){
  //   $ul.innerHTML = "";
  //   return;
  // }

  publicRooms.forEach(({ room_name, user_count }) => {
    const $li = document.createElement("li");
    const $room_name = document.createElement("p");
    $room_name.textContent = `채팅방 명 : ${room_name}`;

    const $user_count = document.createElement("p");
    $user_count.textContent = `유저 수 : ${user_count}명`;

    $li.appendChild($room_name);
    $li.appendChild($user_count);
    $ul.appendChild($li);
    $li.classList.add("chat-room");
    $li.room_name = room_name;
  });

  const $chat_room = $public_room.querySelectorAll(".chat-room");
  $chat_room.forEach(($room) => {
    const cur_click_room_name = $room.room_name;
    const leaving_room_name = ""; // 현재 방 이름을 비우거나 null로 설정
    $room.addEventListener("click", () => {
      gameSocket.emit("enter_room", {
        room_name: cur_click_room_name,
        leaving_room_name,
      });
    });
  });
});
