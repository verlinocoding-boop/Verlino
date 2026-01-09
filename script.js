const board = document.getElementById("board");
const turnText = document.getElementById("turn");

let turn = "white";
let selectedCell = null;

// Bidak unicode
const pieces = {
  white: ["♖","♘","♗","♕","♔","♗","♘","♖"],
  black: ["♜","♞","♝","♛","♚","♝","♞","♜"]
};

// Papan awal
let gameBoard = [
  ["♜","♞","♝","♛","♚","♝","♞","♜"],
  ["♟","♟","♟","♟","♟","♟","♟","♟"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["♙","♙","♙","♙","♙","♙","♙","♙"],
  ["♖","♘","♗","♕","♔","♗","♘","♖"]
];

function createBoard() {
  board.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.classList.add((row + col) % 2 === 0 ? "white" : "black");
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.textContent = gameBoard[row][col];
      cell.addEventListener("click", () => cellClick(cell));
      board.appendChild(cell);
    }
  }
}

function cellClick(cell) {
  const row = cell.dataset.row;
  const col = cell.dataset.col;

  if (selectedCell) {
    movePiece(selectedCell, cell);
    selectedCell.classList.remove("selected");
    selectedCell = null;
  } else if (cell.textContent !== "") {
    selectedCell = cell;
    cell.classList.add("selected");
  }
}

function movePiece(from, to) {
  const fr = from.dataset.row;
  const fc = from.dataset.col;
  const tr = to.dataset.row;
  const tc = to.dataset.col;

  gameBoard[tr][tc] = gameBoard[fr][fc];
  gameBoard[fr][fc] = "";

  turn = turn === "white" ? "black" : "white";
  turnText.innerText = "Giliran: " + (turn === "white" ? "Putih" : "Hitam");

  createBoard();
}

// Init
createBoard();
