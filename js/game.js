const COLS = 4;
const ROWS = 7;
const FRAME_W = 768;
const FRAME_H = 448;
const FRAME_COUNT = COLS * ROWS;
const WALK_SPEED = 220;
const ANIM_FPS = 22;
const TARGET_HEIGHT = 236;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function keyBlack(ctx, width, height) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 18 && data[i + 1] < 18 && data[i + 2] < 18) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(image, 0, 0);
  return image;
}

function trimFrame(source) {
  const ctx = source.getContext("2d");
  const { width, height } = source;
  const image = keyBlack(ctx, width, height);
  const data = image.data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return source;
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d").drawImage(source, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function loadSheet(src) {
  const img = await loadImage(src);
  const frames = [];
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cell = document.createElement("canvas");
    cell.width = FRAME_W;
    cell.height = FRAME_H;
    cell.getContext("2d").drawImage(
      img,
      col * FRAME_W,
      row * FRAME_H,
      FRAME_W,
      FRAME_H,
      0,
      0,
      FRAME_W,
      FRAME_H,
    );
    frames.push(trimFrame(cell));
  }
  return frames;
}

function drawSky(ctx, width, height, groundY) {
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#5f8fb8");
  sky.addColorStop(0.55, "#a8c8de");
  sky.addColorStop(1, "#dce8f2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.ellipse(180, 78, 90, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(240, 86, 70, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(760, 64, 110, 24, 0, 0, Math.PI * 2);
  ctx.ellipse(830, 74, 80, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8eabbc";
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.quadraticCurveTo(180, groundY - 70, 360, groundY - 18);
  ctx.quadraticCurveTo(520, groundY - 88, 720, groundY - 22);
  ctx.quadraticCurveTo(880, groundY - 64, width, groundY - 10);
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b7c9d6";
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.quadraticCurveTo(260, groundY - 36, 520, groundY - 8);
  ctx.quadraticCurveTo(780, groundY - 42, width, groundY);
  ctx.lineTo(0, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawFloor(ctx, width, height, groundY) {
  const snow = ctx.createLinearGradient(0, groundY, 0, height);
  snow.addColorStop(0, "#f4f8fb");
  snow.addColorStop(0.18, "#e4edf4");
  snow.addColorStop(1, "#9aafbe");
  ctx.fillStyle = snow;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(0, groundY, width, 4);
}

export async function startWalk(canvas) {
  const ctx = canvas.getContext("2d");
  const [leftFrames, rightFrames] = await Promise.all([
    loadSheet("/sprites/walker-left.png"),
    loadSheet("/sprites/walker-right.png"),
  ]);

  const keys = new Set();
  const player = {
    x: canvas.width * 0.5,
    facing: 1,
    frame: 0,
    anim: 0,
  };

  const onDown = (event) => {
    const key = event.key.toLowerCase();
    if (key === "o" || key === "p") {
      event.preventDefault();
      keys.add(key);
    }
  };
  const onUp = (event) => {
    keys.delete(event.key.toLowerCase());
  };
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    let dir = 0;
    if (keys.has("o")) dir -= 1;
    if (keys.has("p")) dir += 1;
    if (dir !== 0) {
      player.facing = dir;
      player.x += dir * WALK_SPEED * dt;
      player.anim += dt * ANIM_FPS;
      player.frame = Math.floor(player.anim) % FRAME_COUNT;
    } else {
      player.anim = 0;
      player.frame = 0;
    }

    const frames = player.facing < 0 ? leftFrames : rightFrames;
    const sprite = frames[player.frame] ?? frames[0];
    const scale = TARGET_HEIGHT / sprite.height;
    const drawW = sprite.width * scale;
    const drawH = sprite.height * scale;
    const groundY = canvas.height - 92;
    const minX = drawW * 0.5 + 8;
    const maxX = canvas.width - drawW * 0.5 - 8;
    player.x = Math.max(minX, Math.min(maxX, player.x));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSky(ctx, canvas.width, canvas.height, groundY);
    drawFloor(ctx, canvas.width, canvas.height, groundY);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sprite, player.x - drawW / 2, groundY - drawH + 6, drawW, drawH);

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
