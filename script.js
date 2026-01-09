const board = document.getElementById("board");
const diceText = document.getElementById("dice");
const positionText = document.getElementById("position");

let position = 1;

// Tangga & Ular
const snakesAndLadders = {
  4: 14,
  9: 31,
  17: 7,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  54: 34,
  62: 19,
  64: 60,
  71: 91,
  87: 24,
  93: 73,
  95: 75,
  99: 78
};

// Buat papan
function createBoard() {
  board.innerHTML = "";
  for (let i = 100; i >= 1; i--) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.innerText = i;
    cell.id = "cell-" + i;
    board.appendChild(cell);
  }
}

// Update posisi pemain
function updatePlayer() {
  document.querySelectorAll(".player").forEach(p => p.remove());

  const player = document.createElement("div");
  player.classList.add("player");

  document.getElementById("cell-" + position).appendChild(player);
  positionText.innerText = "Posisi: " + position;
}

// Lempar dadu
function rollDice() {
  let dice = Math.floor(Math.random() * 6) + 1;
  diceText.innerText = "Dadu: " + dice;

  if (position + dice <= 100) {
    position += dice;
  }

  // Cek ular / tangga
  if (snakesAndLadders[position]) {
    let newPos = snakesAndLadders[position];
    alert(position > newPos ? "🐍 Kena ular!" : "🪜 Naik tangga!");
    position = newPos;
  }

  updatePlayer();

  if (position === 100) {
    alert("🎉 Selamat! Kamu menang!");
    position = 1;
    updatePlayer();
  }
}

// Init
createBoard();
updatePlayer();

