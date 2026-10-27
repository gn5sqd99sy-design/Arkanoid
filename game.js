"use strict";

const canvas = document.getElementById("mycanvas");
const context = canvas.getContext("2d");
const background = new Image();

background.addEventListener("load", () => {
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
});

background.addEventListener("error", () => {
  console.error("Arkanoidi taustapilti ei saanud laadida.");
});

background.src = "img/background.png";

const platform = new Image();
const ball = new Image();
const block = new Image();
let blockLoaded = false;

let platformLoaded = false;
let ballLoaded = false;

function drawObjects() {
  if (blockLoaded) {
    const columns = 8;
    const rows = 3;
    const width = 65;
    const height = 25;
    const gap = 8;
    const startX = (canvas.width - columns * (width + gap) + gap) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        context.drawImage(block,
          startX + col * (width + gap),
          70 + row * (height + gap),
          width, height);
      }
    }
  }

  if (!platformLoaded || !ballLoaded) return;

  const platformWidth = 110;
  const platformHeight = 20;
  const ballSize = 20;

  const platformX = (canvas.width - platformWidth) / 2;
  const platformY = canvas.height - platformHeight - 20;

  context.drawImage(platform, platformX, platformY, platformWidth, platformHeight);
  context.drawImage(ball, canvas.width / 2 - ballSize / 2, platformY - ballSize, ballSize, ballSize);
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
