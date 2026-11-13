"use strict";

const KEYS = Object.freeze({ LEFT: "ArrowLeft", RIGHT: "ArrowRight", SPACE: "Space" });

// Sama mängumudel töötab nii brauseris kui ka eraldi vm-kontekstis.
const game = {
  width: 640,
  height: 360,
  score: 0,
  blocks: [],
  running: false,
  paused: false,
  finished: false,
  won: false,
  frameId: null,
  sounds: {
    bump: {
      play() {
        if (!game.bumpSound) return;
        const sound = game.bumpSound.cloneNode();
        sound.volume = 0.4;
        const playback = sound.play();
        if (playback && playback.catch) playback.catch(() => {});
      }
    }
  },
  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  create() {
    this.stopLoop();
    this.score = 0;
    this.running = false;
    this.paused = false;
    this.finished = false;
    this.won = false;
    this.blocks = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        this.blocks.push({
          x: 65 + col * 64,
          y: 35 + row * 24,
          width: 60,
          height: 20,
          active: true
        });
      }
    }
    Object.assign(this.ball, { x: 320, y: 280, dx: 0, dy: 0 });
    Object.assign(this.platform, { x: 280, y: 300, dx: 0, speed: 6, ball: this.ball });
  },
  addScore() {
    this.score++;
    if (this.score === this.blocks.length) this.end();
  },
  end() {
    if (this.finished) return;
    this.won = this.blocks.length > 0 && this.score === this.blocks.length;
    this.finished = true;
    this.running = false;
    this.platform.stop();
    this.stopLoop();
  },
  collideBlocks() {
    for (const block of this.blocks) {
      if (block.active && this.ball.collide(block)) {
        this.ball.bumpBlock(block);
        this.addScore();
        break;
      }
    }
  },
  stopLoop() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  },
  scheduleFrame() {
    if (this.frameId !== null || !this.running || this.paused || this.finished) return;
    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      this.update();
      this.draw();
      this.scheduleFrame();
    });
  },
  update() {
    if (!this.running || this.paused || this.finished) return;
    this.platform.collideWorldBounds();
    this.platform.move();
    if (this.platform.ball) return;
    this.ball.collideWorldBounds();
    if (this.finished) return;
    if (this.ball.dy > 0 && this.ball.collide(this.platform)) {
      this.ball.y = this.platform.y - this.ball.height;
      this.ball.bumpPlatform(this.platform);
    }
    this.collideBlocks();
    if (!this.finished) this.ball.move();
  },
  ball: {
    x: 320, y: 280, width: 20, height: 20, dx: 0, dy: 0,
    move() {
      this.x += this.dx;
      this.y += this.dy;
    },
    start() {
      this.dx = game.random(-3, 3);
      this.dy = -3;
    },
    collide(target) {
      const x = this.x + this.dx;
      const y = this.y + this.dy;
      return x < target.x + target.width && x + this.width > target.x &&
        y < target.y + target.height && y + this.height > target.y;
    },
    bumpBlock(block) {
      if (!block.active) return;
      block.active = false;
      this.dy = -this.dy;
      game.sounds.bump.play();
    },
    bumpPlatform(platform) {
      this.dy = -Math.abs(this.dy);
      this.dx = platform.getTouchOffset(this.x + this.width / 2) * 3;
      game.sounds.bump.play();
    },
    collideWorldBounds() {
      if (this.x + this.dx < 0) {
        this.x = 0;
        this.dx = Math.abs(this.dx);
        game.sounds.bump.play();
      } else if (this.x + this.dx + this.width > game.width) {
        this.x = game.width - this.width;
        this.dx = -Math.abs(this.dx);
        game.sounds.bump.play();
      }
      if (this.y + this.dy < 0) {
        this.y = 0;
        this.dy = Math.abs(this.dy);
        game.sounds.bump.play();
      }
      if (this.y + this.dy + this.height > game.height) game.end();
    }
  },
  platform: {
    x: 280, y: 300, width: 100, height: 20, dx: 0, speed: 6, ball: null,
    start(key) {
      if (key === KEYS.LEFT) this.dx = -this.speed;
      if (key === KEYS.RIGHT) this.dx = this.speed;
    },
    stop() { this.dx = 0; },
    move() {
      const nextX = Math.max(0, Math.min(game.width - this.width, this.x + this.dx));
      if (this.ball) this.ball.x += nextX - this.x;
      this.x = nextX;
    },
    fire() {
      if (!this.ball) return;
      this.ball.start();
      this.ball = null;
    },
    getTouchOffset(x) {
      return Math.max(-1, Math.min(1, (x - this.x - this.width / 2) / (this.width / 2)));
    },
    collideWorldBounds() {
      if (this.x + this.dx < 0 || this.x + this.dx + this.width > game.width) this.stop();
    }
  },
  draw() {
    const ctx = this.context;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.width, this.height);
    const background = this.images.background;
    if (background.complete && background.naturalWidth) {
      const scale = Math.max(this.width / background.naturalWidth, this.height / background.naturalHeight);
      const width = background.naturalWidth * scale;
      const height = background.naturalHeight * scale;
      ctx.drawImage(background, (this.width - width) / 2, (this.height - height) / 2, width, height);
    } else {
      ctx.fillStyle = "#211229";
      ctx.fillRect(0, 0, this.width, this.height);
    }
    for (const block of this.blocks) {
      if (block.active) this.drawSprite(this.images.block, block, "#55c7e8");
    }
    this.drawSprite(this.images.platform, this.platform, "#eeeeee");
    ctx.fillStyle = "#f5d742";
    ctx.beginPath();
    ctx.arc(this.ball.x + 10, this.ball.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Punktid: " + this.score, 12, 24);
    ctx.textAlign = "right";
    ctx.fillText("Kiirus: " + this.platform.speed, this.width - 12, 24);
    if (this.paused || this.finished) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 48px Arial";
      ctx.fillText(this.paused ? "Paus" : this.won ? "Võitsid!" : "Kaotasid!", 320, 180);
      if (this.finished) {
        ctx.font = "22px Arial";
        ctx.fillText("Punktid: " + this.score + " — R: uus mäng", 320, 225);
      }
    }
  },
  drawSprite(image, item, color) {
    if (image.complete && image.naturalWidth) {
      this.context.drawImage(image, item.x, item.y, item.width, item.height);
    } else {
      this.context.fillStyle = color;
      this.context.fillRect(item.x, item.y, item.width, item.height);
    }
  }
};

game.create();

// Brauseri sisend ja joonistamine kasutavad ülal defineeritud mängumudelit.
const canvas = document.getElementById("mycanvas");
game.context = canvas.getContext("2d");
game.images = {};
for (const name of ["background", "platform", "block"]) {
  const image = new Image();
  game.images[name] = image;
  image.addEventListener("load", () => game.draw());
  image.addEventListener("error", () => console.error(`Pilti ei saanud laadida: ${name}`));
  image.src = `img/${name}.png`;
}
game.bumpSound = new Audio("sounds/bump.mp3");

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * ratio);
  canvas.height = Math.round(bounds.height * ratio);
  game.context.setTransform(canvas.width / game.width, 0, 0, canvas.height / game.height, 0, 0);
  game.draw();
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("blur", () => {
  game.platform.stop();
  if (game.running && !game.finished) {
    game.paused = true;
    game.stopLoop();
    game.draw();
  }
});

document.addEventListener("keydown", event => {
  if (event.code === "KeyR" && game.finished) {
    event.preventDefault();
    game.create();
    game.draw();
    return;
  }
  if (event.code === "KeyP" && !event.repeat && !game.finished) {
    event.preventDefault();
    game.paused = !game.paused;
    game.platform.stop();
    if (game.paused) game.stopLoop();
    else game.scheduleFrame();
    game.draw();
    return;
  }
  if (game.paused || game.finished) return;
  if (event.key === KEYS.LEFT || event.key === KEYS.RIGHT) {
    event.preventDefault();
    game.platform.start(event.key);
    game.running = true;
    game.scheduleFrame();
  } else if (event.code === KEYS.SPACE) {
    event.preventDefault();
    game.platform.fire();
    game.running = true;
    game.scheduleFrame();
  } else if (event.key === "+" || event.key === "-" || event.code === "NumpadAdd" || event.code === "NumpadSubtract") {
    event.preventDefault();
    const increase = event.key === "+" || event.code === "NumpadAdd";
    game.platform.speed = Math.max(2, Math.min(16, game.platform.speed + (increase ? 1 : -1)));
    if (game.platform.dx) game.platform.dx = Math.sign(game.platform.dx) * game.platform.speed;
    game.draw();
  }
});
document.addEventListener("keyup", event => {
  if ((event.key === KEYS.LEFT && game.platform.dx < 0) ||
      (event.key === KEYS.RIGHT && game.platform.dx > 0)) game.platform.stop();
});
resizeCanvas();
