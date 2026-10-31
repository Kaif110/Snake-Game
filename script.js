const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("bestScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayIcon = document.getElementById("overlayIcon");
const overlayStart = document.getElementById("overlayStart");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

const tileCount = 20;
const tileSize = canvas.width / tileCount;
const startSnake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];

let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let bestScore = Number(localStorage.getItem("snakeClubBest")) || 0;
let gameLoop = null;
let gameRunning = false;
let gameOver = false;
let speed = 125;

bestElement.textContent = bestScore;

function resetGame() {
  snake = startSnake.map(part => ({ ...part }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = 125;
  gameOver = false;
  updateScore();
  placeFood();
  drawGame();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some(part => part.x === food.x && part.y === food.y));
}

function drawGame() {
  ctx.fillStyle = "#e9eddf";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft grid in the background
  ctx.strokeStyle = "rgba(81, 111, 67, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(canvas.width, i * tileSize);
    ctx.stroke();
  }

  // Food
  const foodX = food.x * tileSize + tileSize / 2;
  const foodY = food.y * tileSize + tileSize / 2;
  ctx.fillStyle = "#e8894d";
  ctx.beginPath();
  ctx.arc(foodX, foodY, tileSize * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#547a43";
  ctx.fillRect(foodX + 1, foodY - tileSize * 0.43, 3, 7);

  // Snake body
  snake.forEach((part, index) => {
    const inset = 2;
    ctx.fillStyle = index === 0 ? "#365b32" : "#5c874b";
    roundRect(
      ctx,
      part.x * tileSize + inset,
      part.y * tileSize + inset,
      tileSize - inset * 2,
      tileSize - inset * 2,
      index === 0 ? 7 : 5
    );
  });

  // Eyes on the snake's head
  const head = snake[0];
  ctx.fillStyle = "#f8f7ed";
  const eyeOffsetX = direction.x === 0 ? 5 : (direction.x > 0 ? 10 : 3);
  const eyeOffsetY = direction.y === 0 ? 5 : (direction.y > 0 ? 10 : 3);
  const eyeA = { x: head.x * tileSize + eyeOffsetX, y: head.y * tileSize + eyeOffsetY };
  const eyeB = { x: head.x * tileSize + (direction.x === 0 ? tileSize - 8 : eyeOffsetX),
                 y: head.y * tileSize + (direction.y === 0 ? tileSize - 8 : eyeOffsetY) };
  ctx.beginPath();
  ctx.arc(eyeA.x, eyeA.y, 2.3, 0, Math.PI * 2);
  ctx.arc(eyeB.x, eyeB.y, 2.3, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function updateGame() {
  direction = { ...nextDirection };
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const hitWall = newHead.x < 0 || newHead.x >= tileCount ||
                  newHead.y < 0 || newHead.y >= tileCount;
  const ateFood = newHead.x === food.x && newHead.y === food.y;
  const bodyToCheck = ateFood ? snake : snake.slice(0, -1);
  const hitSelf = bodyToCheck.some(part => part.x === newHead.x && part.y === newHead.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(newHead);
  if (ateFood) {
    score += 10;
    updateScore();
    placeFood();
    if (score % 50 === 0 && speed > 70) {
      speed -= 5;
      clearInterval(gameLoop);
      gameLoop = setInterval(updateGame, speed);
    }
  } else {
    snake.pop();
  }
  drawGame();
}

function updateScore() {
  scoreElement.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    bestElement.textContent = bestScore;
    localStorage.setItem("snakeClubBest", bestScore);
  }
}

function startGame() {
  if (gameRunning) return;
  if (gameOver) resetGame();
  gameRunning = true;
  overlay.classList.add("hidden");
  pauseBtn.disabled = false;
  pauseBtn.textContent = "Pause";
  startBtn.textContent = "Playing...";
  gameLoop = setInterval(updateGame, speed);
}

function pauseGame() {
  if (!gameRunning) return;
  clearInterval(gameLoop);
  gameRunning = false;
  pauseBtn.textContent = "Resume";
  startBtn.textContent = "Start game";
  showOverlay("Paused", "Take a breath. Your game is waiting.", "⏸️", "Resume game");
}

function endGame() {
  clearInterval(gameLoop);
  gameRunning = false;
  gameOver = true;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pause";
  startBtn.textContent = "Play again";
  showOverlay("Game over!", `You scored ${score} points. Fancy another round?`, "🐍", "Play again");
}

function showOverlay(title, message, icon, buttonText) {
  overlayTitle.textContent = title;
  overlayText.textContent = message;
  overlayIcon.textContent = icon;
  overlayStart.innerHTML = `${buttonText} <span>→</span>`;
  overlay.classList.remove("hidden");
}

function changeDirection(newDirection) {
  const opposite = direction.x + newDirection.x === 0 &&
                   direction.y + newDirection.y === 0;
  if (!opposite) nextDirection = newDirection;
}

document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  const directions = {
    arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 }
  };
  if (directions[key]) {
    event.preventDefault();
    changeDirection(directions[key]);
  }
  if (key === " " && !event.repeat) {
    event.preventDefault();
    gameRunning ? pauseGame() : startGame();
  }
});

document.querySelectorAll(".direction").forEach(button => {
  button.addEventListener("click", () => {
    const directions = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    changeDirection(directions[button.dataset.dir]);
  });
});

startBtn.addEventListener("click", startGame);
overlayStart.addEventListener("click", startGame);
pauseBtn.addEventListener("click", () => gameRunning ? pauseGame() : startGame());
restartBtn.addEventListener("click", () => {
  clearInterval(gameLoop);
  gameRunning = false;
  resetGame();
  startGame();
});

resetGame();
