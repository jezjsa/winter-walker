const COLS = 4;
const FRAME_W = 768;
const FRAME_H = 448;
const WALK_COUNT = 28;
const JUMP_COUNT = 21;
const WALK_SPEED = 220;
const ANIM_FPS = 22;
const JUMP_FPS = 20;
const JUMP_HEIGHT = 148;
const JUMP_LIFT_START = 5;
const JUMP_LIFT_END = 17;
const TARGET_HEIGHT = Math.round(236 * (2 / 3));
// Passing poses — feet closest together, one per step in the 28-frame cycle.
const REST_FRAMES = [5, 19];

function isRestFrame(frame) {
  return REST_FRAMES.includes(frame);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function isBackdrop(data, i) {
  return data[i] < 14 && data[i + 1] < 14 && data[i + 2] < 14;
}

// Only punch out the black sheet behind him. Interior darks (hood, folds)
// stay opaque — a flat key was cutting holes in the legs and face.
function keyBackdrop(ctx, width, height) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const seen = new Uint8Array(width * height);
  const stack = [];

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p]) return;
    seen[p] = 1;
    if (isBackdrop(data, p * 4)) stack.push(p);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (stack.length) {
    const p = stack.pop();
    data[p * 4 + 3] = 0;
    const x = p % width;
    const y = (p - x) / width;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  ctx.putImageData(image, 0, 0);
  return image;
}

function trimFrame(source) {
  const ctx = source.getContext("2d");
  const { width, height } = source;
  const image = keyBackdrop(ctx, width, height);
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

async function loadSheet(src, frameCount) {
  const img = await loadImage(src);
  const frames = [];
  for (let i = 0; i < frameCount; i += 1) {
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

function wrap(value, period) {
  return ((value % period) + period) % period;
}

function hash(n) {
  let x = (n * 374761393 + 668265263) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return (x >>> 0) / 4294967296;
}

function eachTile(width, period, scroll, draw) {
  const start = -wrap(scroll, period) - period;
  for (let x = start, i = Math.floor((scroll - period) / period); x < width + period; x += period, i += 1) {
    draw(x, i);
  }
}

function drawCloud(ctx, x, y, w) {
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.55, y + 6, w * 0.72, w * 0.22, 0, 0, Math.PI * 2);
  ctx.ellipse(x - w * 0.4, y + 4, w * 0.5, w * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx, x, groundY, period, rise, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.quadraticCurveTo(x + period * 0.22, groundY - rise, x + period * 0.4, groundY - rise * 0.35);
  ctx.quadraticCurveTo(x + period * 0.62, groundY - rise * 1.15, x + period * 0.82, groundY - rise * 0.28);
  ctx.quadraticCurveTo(x + period * 0.93, groundY - rise * 0.5, x + period, groundY);
  ctx.lineTo(x + period, groundY + 8);
  ctx.lineTo(x, groundY + 8);
  ctx.closePath();
  ctx.fill();
}

function drawPine(ctx, x, groundY, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, groundY - h);
  ctx.lineTo(x + h * 0.38, groundY - h * 0.42);
  ctx.lineTo(x + h * 0.18, groundY - h * 0.42);
  ctx.lineTo(x + h * 0.42, groundY - h * 0.18);
  ctx.lineTo(x + h * 0.12, groundY - h * 0.18);
  ctx.lineTo(x + h * 0.28, groundY);
  ctx.lineTo(x - h * 0.28, groundY);
  ctx.lineTo(x - h * 0.12, groundY - h * 0.18);
  ctx.lineTo(x - h * 0.42, groundY - h * 0.18);
  ctx.lineTo(x - h * 0.18, groundY - h * 0.42);
  ctx.lineTo(x - h * 0.38, groundY - h * 0.42);
  ctx.closePath();
  ctx.fill();
}

function drawWorld(ctx, width, height, groundY, worldX) {
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#5f8fb8");
  sky.addColorStop(0.55, "#a8c8de");
  sky.addColorStop(1, "#dce8f2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  eachTile(width, 920, worldX * 0.12, (x, i) => {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    drawCloud(ctx, x + 80 + hash(i) * 200, 58 + hash(i + 3) * 36, 70 + hash(i + 7) * 50);
    drawCloud(ctx, x + 480 + hash(i + 11) * 160, 42 + hash(i + 13) * 28, 90 + hash(i + 17) * 40);
  });

  eachTile(width, 760, worldX * 0.22, (x) => {
    drawHills(ctx, x, groundY, 760, 118, "#7e9aab");
  });

  eachTile(width, 560, worldX * 0.4, (x) => {
    drawHills(ctx, x, groundY, 560, 64, "#a7bcc9");
  });

  eachTile(width, 420, worldX * 0.68, (x, i) => {
    const count = 2 + Math.floor(hash(i) * 2);
    for (let n = 0; n < count; n += 1) {
      const px = x + 40 + hash(i * 17 + n) * 340;
      const h = 46 + hash(i * 31 + n) * 70;
      drawPine(ctx, px, groundY, h, n % 2 ? "#5d7380" : "#6b8490");
    }
  });

  const snow = ctx.createLinearGradient(0, groundY, 0, height);
  snow.addColorStop(0, "#f4f8fb");
  snow.addColorStop(0.2, "#e4edf4");
  snow.addColorStop(1, "#9aafbe");
  ctx.fillStyle = snow;
  ctx.fillRect(0, groundY, width, height - groundY);

  eachTile(width, 280, worldX, (x, i) => {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(x + 70 + hash(i) * 120, groundY + 10, 46 + hash(i + 2) * 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillRect(0, groundY, width, 3);
}

function jumpLift(anim) {
  if (anim <= JUMP_LIFT_START || anim >= JUMP_LIFT_END) return 0;
  const t = (anim - JUMP_LIFT_START) / (JUMP_LIFT_END - JUMP_LIFT_START);
  return JUMP_HEIGHT * Math.sin(Math.PI * t);
}

function drawWalker(ctx, sprite, centerX, drawY, facing, scale) {
  const drawW = sprite.width * scale;
  const drawH = sprite.height * scale;
  if (facing < 0) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, -(centerX + drawW / 2), drawY, drawW, drawH);
    ctx.restore();
  } else {
    ctx.drawImage(sprite, centerX - drawW / 2, drawY, drawW, drawH);
  }
  return { drawW, drawH };
}

export async function startWalk(canvas) {
  const ctx = canvas.getContext("2d");
  // Sheets face right. Mirror for left.
  const [walkFrames, jumpFrames] = await Promise.all([
    loadSheet("/sprites/walker-right.png", WALK_COUNT),
    loadSheet("/sprites/jumper-right.png", JUMP_COUNT),
  ]);

  const keys = new Set();
  const player = {
    worldX: 0,
    facing: 1,
    frame: REST_FRAMES[0],
    anim: REST_FRAMES[0],
    stepping: false,
    jumping: false,
    jumpAnim: 0,
  };

  const onDown = (event) => {
    if (event.target.closest("input, textarea")) return;
    const key = event.key.toLowerCase();
    if (key === "o" || key === "p") {
      event.preventDefault();
      keys.add(key);
    }
    if (event.code === "Space" || key === " ") {
      event.preventDefault();
      if (!event.repeat) keys.add("jump");
    }
  };
  const onUp = (event) => {
    const key = event.key.toLowerCase();
    keys.delete(key);
    if (event.code === "Space" || key === " ") keys.delete("jump");
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

    if (keys.has("jump") && !player.jumping) {
      player.jumping = true;
      player.jumpAnim = 0;
      player.stepping = false;
    }
    keys.delete("jump");

    if (dir !== 0) {
      player.facing = dir;
      if (!player.jumping) player.stepping = true;
    }

    if (player.jumping) {
      player.jumpAnim += dt * JUMP_FPS;
      if (dir !== 0) player.worldX += player.facing * WALK_SPEED * dt;
      if (player.jumpAnim >= JUMP_COUNT) {
        player.jumping = false;
        player.jumpAnim = 0;
        player.frame = REST_FRAMES[0];
        player.anim = REST_FRAMES[0];
        if (dir !== 0) player.stepping = true;
      }
    } else if (player.stepping) {
      player.anim += dt * ANIM_FPS;
      player.frame = Math.floor(player.anim) % WALK_COUNT;
      player.worldX += player.facing * WALK_SPEED * dt;
      if (dir === 0 && isRestFrame(player.frame)) {
        player.stepping = false;
        player.anim = player.frame;
      }
    }

    const sprite = player.jumping
      ? (jumpFrames[Math.min(JUMP_COUNT - 1, Math.floor(player.jumpAnim))] ?? jumpFrames[0])
      : (walkFrames[player.frame] ?? walkFrames[0]);
    const scale = TARGET_HEIGHT / sprite.height;
    const groundY = canvas.height - 92;
    const centerX = canvas.width * 0.5;
    const lift = player.jumping ? jumpLift(player.jumpAnim) : 0;
    const drawH = TARGET_HEIGHT;
    const drawY = groundY - drawH + 6 - lift;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWorld(ctx, canvas.width, canvas.height, groundY, player.worldX);
    ctx.imageSmoothingEnabled = true;
    drawWalker(ctx, sprite, centerX, drawY, player.facing, scale);

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
