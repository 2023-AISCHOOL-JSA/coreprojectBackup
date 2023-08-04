const chat_btn = document.getElementById("chat_btn")
const game_btn = document.getElementById("game_btn")

chat_btn.addEventListener("click", () => {
    window.location.href = "/chat";
})

game_btn.addEventListener("click", () => {window.location.href = "/game";})