// app.js - simple chess UI using chess.js
// Klik sebuah kotak (sumber) lalu klik kotak tujuan.
// Jika promosi pion terjadi, otomatis jadi queen.

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const moveListEl = document.getElementById('moveList');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const flipBtn = document.getElementById('flipBtn');
const highlightCheckbox = document.getElementById('highlightMoves');

let game = new Chess(); // from chess.js
let selectedSquare = null;
let boardFlipped = false;

// Unicode pieces
const UNICODE = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

// Create board squares (a8..h1) in DOM order corresponding to chess.js board() output
const files = ['a','b','c','d','e','f','g','h'];
function squareName(fileIdx, rankIdx, flipped=false){
  const file = files[flipped ? 7-fileIdx : fileIdx];
  const rank = flipped ? (rankIdx+1) : (8-rankIdx);
  return `${file}${rank}`;
}

function buildBoard(){
  boardEl.innerHTML = '';
  for(let r=0;r<8;r++){
    for(let f=0;f<8;f++){
      const sq = document.createElement('div');
      sq.className = 'square';
      const isLight = (r+f) % 2 === 0;
      sq.classList.add(isLight ? 'light' : 'dark');
      sq.dataset.r = r; sq.dataset.f = f;
      const coord = squareName(f,r, boardFlipped);
      sq.dataset.coord = coord;
      const coordEl = document.createElement('div');
      coordEl.className = 'coord'; coordEl.textContent = coord;
      sq.appendChild(coordEl);
      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  renderPieces();
}

function renderPieces(){
  const squares = boardEl.querySelectorAll('.square');
  // Clear piece text and classes
  squares.forEach(sq=>{
    // remove piece text nodes except .coord
    sq.childNodes.forEach(node=>{
      if(node.nodeType===3) node.textContent = '';
      if(node.nodeType===1 && !node.classList.contains('coord') && node.className !== 'coord') {
        // nothing
      }
    });
    // remove piece char existing (we'll set textContent directly)
    const children = Array.from(sq.childNodes).filter(n=>n.nodeType===3 || (n.nodeType===1 && !n.classList.contains('coord')));
    children.forEach(n=>n.remove());
    // remove highlight/selected classes
    sq.classList.remove('selected','move-highlight','capture-highlight');
  });

  // Use chess.board(); returns array of ranks from 8 to 1
  const board = game.board();
  for(let rankIdx=0; rankIdx<8; rankIdx++){
    const rank = board[rankIdx];
    for(let fileIdx=0; fileIdx<8; fileIdx++){
      const piece = rank[fileIdx]; // null or {type,color}
      // map to DOM square index depending on flipped state
      // Our DOM iteration uses r (0..7) and f (0..7) matching squareName mapping
      // Determine DOM r,f such that its coord matches squareName(fileIdx, rankIdx)
      // Simpler: compute coordinate string and find the square by dataset.coord
      const coord = `${files[fileIdx]}${8-rankIdx}`;
      const query = `.square[data-coord="${coord}"]`;
      const sq = boardEl.querySelector(query);
      if(!sq) continue;
      if(piece){
        const sym = piece.color === 'w' ? UNICODE[piece.type.toUpperCase()] : UNICODE[piece.type];
        // create text node for piece (so .coord element remains)
        const txt = document.createTextNode(sym);
        sq.insertBefore(txt, sq.firstChild);
      }
    }
  }

  updateStatus();
  updateMoveList();
  // re-apply selection highlight if any
  if(selectedSquare){
    const sqEl = boardEl.querySelector(`.square[data-coord="${selectedSquare}"]`);
    if(sqEl) sqEl.classList.add('selected');
  }
}

function onSquareClick(e){
  const sq = e.currentTarget;
  const coord = sq.dataset.coord;
  if(!selectedSquare){
    // Select only if there's a piece of the side to move
    const moves = game.moves({square: coord, verbose:true});
    if(moves.length === 0) return;
    selectedSquare = coord;
    sq.classList.add('selected');
    if(highlightCheckbox.checked) showHighlights(moves);
  } else {
    if(coord === selectedSquare){
      // deselect
      selectedSquare = null;
      clearHighlights();
      renderPieces();
      return;
    }
    // Try to move
    const moveObj = {from: selectedSquare, to: coord, promotion: 'q'}; // auto queen on promotion
    const move = game.move(moveObj);
    if(move === null){
      // invalid move: maybe user clicked another own piece -> reselect if allowed
      const moves = game.moves({square: coord, verbose:true});
      if(moves.length > 0 && (game.turn() === (moves[0].color))) {
        selectedSquare = coord;
        clearHighlights();
        renderPieces();
        const nextMoves = game.moves({square: coord, verbose:true});
        if(highlightCheckbox.checked) showHighlights(nextMoves);
      } else {
        // invalid; ignore
      }
    } else {
      selectedSquare = null;
      clearHighlights();
      renderPieces();
    }
  }
}

function showHighlights(moves){
  // moves: array of verbose move objects
  clearHighlights();
  moves.forEach(m=>{
    const target = m.to;
    const sq = boardEl.querySelector(`.square[data-coord="${target}"]`);
    if(!sq) return;
    if(m.captured) sq.classList.add('capture-highlight'); else sq.classList.add('move-highlight');
  });
}

function clearHighlights(){
  boardEl.querySelectorAll('.square').forEach(s=>{
    s.classList.remove('move-highlight','capture-highlight','selected');
  });
}

function updateStatus(){
  const turn = game.turn() === 'w' ? 'Putih' : 'Hitam';
  let status = `${turn} bergerak`;
  if(game.in_checkmate()){
    status = `Skakmat — ${turn} kalah.`;
  } else if(game.in_draw()){
    status = 'Seri (draw).';
  } else if(game.in_check()){
    status += ' (skak!)';
  }
  statusEl.textContent = status;
}

function updateMoveList(){
  moveListEl.innerHTML = '';
  const history = game.history({verbose:true});
  // history is sequence of move objects; we will format as algebraic move list
  let moves = [];
  for(let i=0;i<history.length;i+=2){
    const num = Math.floor(i/2)+1;
    const white = history[i] ? history[i].san : '';
    const black = history[i+1] ? history[i+1].san : '';
    const li = document.createElement('li');
    li.textContent = `${white} ${black ? ' ' + black : ''}`;
    moveListEl.appendChild(li);
  }
  // scroll to bottom
  moveListEl.parentElement.scrollTop = moveListEl.parentElement.scrollHeight;
}

// Controls
newGameBtn.addEventListener('click', ()=> {
  game.reset();
  selectedSquare = null;
  clearHighlights();
  renderPieces();
});

undoBtn.addEventListener('click', ()=>{
  game.undo();
  selectedSquare = null;
  clearHighlights();
  renderPieces();
});

flipBtn.addEventListener('click', ()=>{
  boardFlipped = !boardFlipped;
  // rebuild squares with flipped coords
  buildBoard();
});

highlightCheckbox.addEventListener('change', ()=>{
  clearHighlights();
  selectedSquare = null;
  renderPieces();
});

// Initialize
buildBoard();
renderPieces();
updateStatus();
updateMoveList();
