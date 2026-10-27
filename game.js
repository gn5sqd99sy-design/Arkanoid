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
