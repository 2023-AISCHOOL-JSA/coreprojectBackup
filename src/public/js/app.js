const frontSocket = io(); // io함수는 알아서 socket.io를 실행하고 서버를 찾는다.

const $welcome = document.getElementById("welcome");
const $enter_form = $welcome.querySelector("#enter");
const $room_name_input = $enter_form.querySelector("#room_name_input");
const $name_form = $welcome.querySelector("#nickname");
const $public_room = document.querySelector("#public_room");

// const $room = document.getElementById("room");
// const $room_name = $room.querySelector("#room_name");
let room_name;

// room.hidden = true; // 방 입장 전 메시지 폼 가리기

// 메세지 추가하는 함수
function addMessage(nickname, message) {
  //메세지
  const $ul = $room.querySelector("ul");
  const $li = document.createElement("li");
  $li.textContent = `${nickname} : ${message}`;
  $ul.appendChild($li);
}

// 메세지 전송 버튼의 함수
const handleMessageSubmit = (event, room_name) => {
  event.preventDefault();
  const $input = $room.querySelector("#message input");

  // 메시지 전송
  frontSocket.emit("new_message", { message: $input.value, room_name }, () => {
    addMessage("나", $input.value);
    $input.value = "";
  });
};

// 닉네임 설정 함수
const handleNicknameSubmit = (event) => {
  event.preventDefault(); // 페이지 전환 없애기
  const $input = $welcome.querySelector("#nickname input");
  frontSocket.emit("nickname", { nickname: $input.value }, () => {
    $input.value = "";
  });
};

// 방 입장후 메시지 폼 보여주는 함수
const showRoom = (room_name) => {
  $welcome.hidden = true;
  $room.hidden = false;
  $public_room.hidden = true;

  //채팅방 이름 갱신
  $room_name.textContent = `Room ${room_name}`;

  //채팅 삭제
  const $ul = $room.querySelector("ul");
  $ul.innerHTML = "";

  // const h3_roomName = room.querySelector("h3");
  // h3_roomName.innerText = `Room : ${room_name} (${count})`;

  const $message_form = $room.querySelector("#message");
  $message_form.addEventListener("submit", (event) =>
    handleMessageSubmit(event, room_name)
  );
};




// 닉네임 저장
$name_form.addEventListener("submit", handleNicknameSubmit);

// 방 입장 함수
const handleRoomSubmit = (event) => {
  event.preventDefault();
  // console.log($room_name_input.value);
  const $input = $room_name_input.value;
  // console.log($input);

  // 새로운 URL 만들기
  const newUrl = `${window.location.origin}/home/room/${encodeURIComponent($input)}`;

  // URL 변경하여 페이지 이동
  window.location.href = newUrl;
  // 프론트에서 서버로 이벤트명을 개발자 마음대로 만들 수 있다 (동일하게해야함)
  // WebSocket에서는 String형태로만 보낼 수 있었지만 Socket.io는 객체도 보낼 수 있다.
  // 3번째 인자로 함수를 프론트에서 서버로 보낼 수 있다.

  // console.log($input);
  frontSocket.emit("enter_room", { room_name: $input }, showRoom);
  $input.value = "";
};

// 방에 입장하기
$enter_form.addEventListener("submit", handleRoomSubmit);

frontSocket.on("welcome", ({ nickname, user_count }) => {
  // const h3_roomName = room.querySelector("h3");
  // h3_roomName.innerText = `Room : ${roomName} (${newCount}명)`;
  addNotice(`${nickname}(이)가 방에 입장했습니다.`);
  setUserCount(user_count);
});

frontSocket.on("bye", ({ nickname, user_count }) => {
  // const h3_roomName = room.querySelector("h3");
  // h3_roomName.innerText = `Room : ${roomName} (${newCount})`;
  addNotice(`${nickname}(이)가 방에서 퇴장했습니다.`);
  setUserCount(user_count);
});

frontSocket.on("new_message", ({ nickname, message }) => {
  //채팅방에 메세지를 보낸다.
  addMessage(nickname, message);
});

// 열린 방을 목록으로 보여주는 기능
frontSocket.on("current_rooms", ({ public_rooms }) => {
  //누군가 socket에 연결하거나, 방을 생성하고, 나갈 때마다 이 이벤트를 받는다.

  //유저에게 오픈채팅방 목록들을 보여주는 역할
  const $ul = $public_room.querySelector("ul");

  $ul.innerHTML = ""; // 방 이름이 중첩되서 출력이 되기때문에 초기화 해줘야함

  public_rooms.forEach(({ room_name, user_count }) => {
    // 각 방의 이름을 목록에 추가
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
    // const leaving_room_name = $room_name_input.textContent.replace("Room", "");
    const leaving_room_name = room_name;
    $room.addEventListener("click", () => {
      frontSocket.emit(
        "enter_room",
        {
          room_name: cur_click_room_name,
          leaving_room_name,
        },
        showRoom
      );
    });
  });
});

frontSocket.on("disconnect", () => console.log("disconnect to server"));
