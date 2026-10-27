"use strict";

const canvas = document.getElementById("mycanvas");
const context = canvas.getContext("2d");
const background = new Image();

background.addEventListener("load", () => {
  drawObjects();
});

background.addEventListener("error", () => {
  console.error("Arkanoidi taustapilti ei saanud laadida.");
});

background.src = "img/background.png";

// KAN-16: sound effects
const bumpSound = new Audio("sounds/bump.mp3");

function playBump() {
  const sound = bumpSound.cloneNode();
  sound.volume = 0.4;
  sound.play().catch(() => {});
}

const platform = new Image();

const platformWidth = 110;
const platformHeight = 20;
const ballSize = 20;
const platformY = canvas.height - platformHeight - 20;
let platformX = (canvas.width - platformWidth) / 2;
let ballLaunched = false;
let ballX = platformX + platformWidth / 2 - ballSize / 2;
let ballY = platformY - ballSize;
let ballVelocityX = 2;
let ballVelocityY = -4;

const platformSpeed = 8;

const ball = new Image();
const block = new Image();
let blockLoaded = false;
let score = 0;
let gameWon = false;
let gamePaused = false;
let animationFrameId = null;

function stopAnimationLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function scheduleNextFrame() {
  if (animationFrameId !== null || !ballLaunched || gamePaused || gameWon) return;
  animationFrameId = requestAnimationFrame(() => {
    animationFrameId = null;
    moveBall();
  });
}
const bricks = Array.from({ length: 3 }, () => Array(8).fill(true));

let platformLoaded = false;
let ballLoaded = false;

function drawObjects() {
  // KAN-12: score
  context.font = "bold 24px Arial";
  context.fillStyle = "#ffffff";
  context.textAlign = "left";
  context.fillText("Punktid: " + score, 20, 40);

  if (background.complete && background.naturalWidth) {
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (blockLoaded) {
    const columns = 8;
    const rows = 3;
    const width = 65;
    const height = 25;
    const gap = 8;
    const startX = (canvas.width - columns * (width + gap) + gap) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (bricks[row][col]) {
          context.drawImage(block,
            startX + col * (width + gap),
            70 + row * (height + gap),
            width, height);
        }
      }
    }
  }

  if (!platformLoaded || !ballLoaded) return;


  context.drawImage(platform, platformX, platformY, platformWidth, platformHeight);
  
  if (!ballLaunched && !gamePaused && !gameWon) {
    ballX = platformX + platformWidth / 2 - ballSize / 2;
    ballY = platformY - ballSize;
  }
  context.drawImage(ball, ballX, ballY, ballSize, ballSize);
  context.font = "bold 24px Arial";
  context.fillStyle = "#ffffff";
  context.textAlign = "left";
  context.fillText("Punktid: " + score, 20, 40);

  // KAN-17: pause display
  if (gamePaused) {
    context.fillStyle = "rgba(0, 0, 0, 0.65)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "bold 48px Arial";
    context.fillText("Paus", canvas.width / 2, canvas.height / 2);
  }

  if (gameWon) {
    context.fillStyle = "rgba(0, 0, 0, 0.65)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "bold 48px Arial";
    context.fillText("Võitsid!", canvas.width / 2, canvas.height / 2);

    context.font = "bold 26px Arial";
    context.fillText("Punktid: " + score,
      canvas.width / 2, canvas.height / 2 + 45);
  }



}

platform.onload = () => {
  platformLoaded = true;
  drawObjects();
};

ball.onload = () => {
  ballLoaded = true;
  drawObjects();
};

platform.onerror = () => console.error("Platvormi pilti ei saanud laadida.");
ball.onerror = () => console.error("Palli pilti ei saanud laadida.");

platform.src = "img/platform.png";
ball.src = "img/ball.png";

block.onload = () => {
  blockLoaded = true;
  drawObjects();
};
block.onerror = () => console.error("Klotsi pilti ei saanud laadida.");
block.src = "img/block.png";


document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (gamePaused) return;

  event.preventDefault();

  if (event.key === "ArrowLeft") {
    platformX -= platformSpeed;
  } else {
    platformX += platformSpeed;
  }

  platformX = Math.max(0, Math.min(canvas.width - platformWidth, platformX));
  drawObjects();
});


document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (!ballLaunched && !gamePaused && !gameWon) {
      ballLaunched = true;
      scheduleNextFrame();
    }
  }
});

// KAN-15: restart game
function restartGame() {
  if (!gameWon) return;

  stopAnimationLoop();
  gamePaused = false;

  gameWon = false;
  ballLaunched = false;
  score = 0;

  for (let row = 0; row < bricks.length; row++) {
    bricks[row].fill(true);
  }

  platformX = (canvas.width - platformWidth) / 2;
  ballX = platformX + platformWidth / 2 - ballSize / 2;
  ballY = platformY - ballSize;

  ballVelocityX = 2;
  ballVelocityY = -4;

  drawObjects();
}

document.addEventListener("keydown", (event) => {
  if (event.code === "KeyR" && gameWon) {
    event.preventDefault();
    restartGame();
  }
});

function moveBall() {
  if (!ballLaunched || gamePaused || gameWon) return;

  ballX += ballVelocityX;
  ballY += ballVelocityY;

  if (ballX <= 0) {
    ballX = 0;
    ballVelocityX = Math.abs(ballVelocityX);
    playBump();
  } else if (ballX + ballSize >= canvas.width) {
    ballX = canvas.width - ballSize;
    ballVelocityX = -Math.abs(ballVelocityX);
    playBump();
  }

  if (ballY <= 0) {
    ballY = 0;
    ballVelocityY = Math.abs(ballVelocityY);
    playBump();
  }

  // KAN-11: brick collision
  const brickWidth = 65;
  const brickHeight = 25;
  const brickGap = 8;
  const brickStartX =
    (canvas.width - 8 * (brickWidth + brickGap) + brickGap) / 2;

  let brickHit = false;

  for (let row = 0; row < 3 && !brickHit; row++) {
    for (let col = 0; col < 8; col++) {
      if (!bricks[row][col]) continue;

      const x = brickStartX + col * (brickWidth + brickGap);
      const y = 70 + row * (brickHeight + brickGap);

      if (
        ballX < x + brickWidth &&
        ballX + ballSize > x &&
        ballY < y + brickHeight &&
        ballY + ballSize > y
      ) {
        bricks[row][col] = false;
        playBump();
        score += 10;

        // KAN-14: victory
        if (bricks.every(row => row.every(active => !active))) {
          gameWon = true;
          ballLaunched = false;
        }
        ballVelocityY = -ballVelocityY;
        brickHit = true;
        break;
      }
    }
  }

  // KAN-10: platform collision
  if (
    ballVelocityY > 0 &&
    ballY + ballSize >= platformY &&
    ballY < platformY + platformHeight &&
    ballX + ballSize > platformX &&
    ballX < platformX + platformWidth
  ) {
    ballY = platformY - ballSize;
    ballVelocityY = -Math.abs(ballVelocityY);
    playBump();
  }

  drawObjects();

  // KAN-13: ball lost
  if (ballY >= canvas.height) {
    ballLaunched = false;

    ballX = platformX + platformWidth / 2 - ballSize / 2;
    ballY = platformY - ballSize;

    ballVelocityX = 2;
    ballVelocityY = -4;

    drawObjects();
    return;
  }

  if (gameWon) {
    drawObjects();
    return;
  }

  scheduleNextFrame();
}

// KAN-15: test victory
document.addEventListener("keydown", (event) => {
  if (event.code === "KeyV") {
    event.preventDefault();
    stopAnimationLoop();
    ballLaunched = false;
    bricks.forEach(row => row.fill(false));
    score = 240;
    gameWon = true;
    drawObjects();
  }
});

// KAN-17: pause
document.addEventListener("keydown", (event) => {
  if (event.code !== "KeyP" || gameWon || event.repeat) return;

  event.preventDefault();
  gamePaused = !gamePaused;
  if (gamePaused) stopAnimationLoop();
  drawObjects();

  if (!gamePaused && ballLaunched) {
    scheduleNextFrame();
  }
});
