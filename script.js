const player = document.getElementById("player");
const obstacle = document.getElementById("obstacle");
const scoreText = document.getElementById("score");

let score = 0;
let isJumping = false;

// Lompat
document.addEventListener("keydown", function(event) {
  if (event.code === "Space" && !isJumping) {
    jump();
  }
});

function jump() {
  isJumping = true;
  player.classList.add("jump");

  setTimeout(() => {
    player.classList.remove("jump");
    isJumping = false;
  }, 600);
}

// Deteksi tabrakan
let collisionCheck = setInterval(() => {
  let playerBottom = parseInt(window.getComputedStyle(player).getPropertyValue("bottom"));
  let obstacleRight = parseInt(window.getComputedStyle(obstacle).getPropertyValue("right"));

  if (obstacleRight > 510 && obstacleRight < 550 && playerBottom < 40) {
    obstacle.style.animation = "none";
    obstacle.style.display = "none";
    alert("Game Over!\nScore: " + score);
    location.reload();
  }
}, 10);

// Score
let scoreCounter = setInterval(() => {
  score++;
  scoreText.innerText = "Score: " + score;
}, 500);

