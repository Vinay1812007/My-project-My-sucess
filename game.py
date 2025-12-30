/* =========================================================
   CORE STATE
========================================================= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================================================
   CUTSCENE
========================================================= */
const cutscene = document.getElementById("cutscene");
const cutsceneText = document.getElementById("cutsceneText");
const skipBtn = document.getElementById("skipCutscene");

const CUTSCENE_SCRIPT = [
  "Hyderabad. Midnight.",
  "Street racers dominate the city.",
  "Win championships.",
  "Evade the police.",
  "Become a legend."
];

let cutsceneIndex = 0;

function playCutscene() {
  cutsceneText.innerText = CUTSCENE_SCRIPT[cutsceneIndex];
  const interval = setInterval(() => {
    cutsceneIndex++;
    if (cutsceneIndex >= CUTSCENE_SCRIPT.length) {
      clearInterval(interval);
      cutscene.style.display = "none";
    } else {
      cutsceneText.innerText = CUTSCENE_SCRIPT[cutsceneIndex];
    }
  }, 2000);
}

skipBtn.onclick = () => cutscene.style.display = "none";
playCutscene();

/* =========================================================
   SEASON & LEAGUES
========================================================= */
const LEAGUES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
let points = Number(localStorage.points || 0);

function currentLeague() {
  return LEAGUES[Math.min(LEAGUES.length - 1, Math.floor(points / 100))];
}

const seasonLength = 30 * 24 * 60 * 60 * 1000;
const seasonId = Math.floor(Date.now() / seasonLength);
document.getElementById("season").innerText = "Season " + seasonId;

/* =========================================================
   WEATHER
========================================================= */
const WEATHERS = ["Clear", "Rain", "Fog"];
let weatherIndex = Math.floor(Math.random() * WEATHERS.length);

setInterval(() => {
  weatherIndex = Math.floor(Math.random() * WEATHERS.length);
}, 30000);

/* =========================================================
   MUSIC SYSTEM
========================================================= */
function Music(src) {
  const a = new Audio(src);
  a.loop = true;
  a.volume = 0;
  return a;
}

const music = {
  drive: Music("music_drive.mp3"),
  chase: Music("music_chase.mp3"),
  replay: Music("music_replay.mp3")
};

let currentMusic = music.drive;

function crossfade(next) {
  next.play().catch(() => {});
  let t = 0;
  const f = setInterval(() => {
    t += 0.05;
    currentMusic.volume = Math.max(0, 0.6 - t);
    next.volume = Math.min(0.6, t);
    if (t >= 0.6) {
      currentMusic.pause();
      currentMusic = next;
      clearInterval(f);
    }
  }, 50);
}

crossfade(music.drive);

/* =========================================================
   PLAYER & CAR
========================================================= */
const GARAGE = [
  { name: "Audi A3", color: "#111", accel: 0.25, grip: 0.93 },
  { name: "BMW 3 Series", color: "#eee", accel: 0.23, grip: 0.91 },
  { name: "Ferrari F8", color: "#c40000", accel: 0.35, grip: 0.88 }
];

let selectedCar = Number(localStorage.car || 0);

const car = {
  x: 240,
  y: 600,
  angle: 0,
  speed: 0,
  grip: GARAGE[selectedCar].grip
};

/* =========================================================
   REPLAY SYSTEM
========================================================= */
let replay = [];
let replayMode = false;
let replayIndex = 0;
let replayPlaying = false;
let cameraMode = 0;

const replayUI = document.getElementById("replayEditor");
const replaySlider = document.getElementById("replaySlider");

function captureReplay() {
  replay.push({ x: car.x, y: car.y, a: car.angle });
  if (replay.length > 900) replay.shift();
  replaySlider.max = replay.length - 1;
}

function exportReplay() {
  const blob = new Blob([JSON.stringify(replay)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "replay.json";
  a.click();
}

/* =========================================================
   POLICE AI
========================================================= */
let heat = 0;
const policeUnits = [
  { x: 200, y: -300, active: false },
  { x: 300, y: -500, active: false }
];

function updatePolice() {
  if (Math.abs(car.speed) > 7) heat += 0.02;
  if (heat > 1) policeUnits.forEach(p => p.active = true);

  policeUnits.forEach(p => {
    if (p.active) {
      p.x += (car.x - p.x) * 0.03;
      p.y += (car.y - p.y) * 0.03;
      if (Math.hypot(car.x - p.x, car.y - p.y) < 30) {
        heat = 0;
        points = Math.max(0, points - 50);
        p.active = false;
        crossfade(music.drive);
      }
    }
  });

  if (heat > 1) crossfade(music.chase);
}

/* =========================================================
   UPDATE LOOP
========================================================= */
function update() {
  car.grip = weatherIndex === 1 ? 0.85 : weatherIndex === 2 ? 0.88 : GARAGE[selectedCar].grip;

  if (keys["1"]) selectedCar = 0;
  if (keys["2"]) selectedCar = 1;
  if (keys["3"]) selectedCar = 2;

  if (keys["w"]) car.speed += GARAGE[selectedCar].accel;
  if (keys["s"]) car.speed -= GARAGE[selectedCar].accel * 1.3;
  if (keys["a"]) car.angle -= 0.04 * (car.speed / 4);
  if (keys["d"]) car.angle += 0.04 * (car.speed / 4);

  car.speed *= car.grip;
  car.speed = Math.max(-3, Math.min(10, car.speed));

  car.x += Math.sin(car.angle) * car.speed;
  car.y -= Math.cos(car.angle) * car.speed;

  captureReplay();
  updatePolice();

  document.getElementById("speed").innerText = Math.abs(car.speed * 12 | 0) + " km/h";
  document.getElementById("carName").innerText = GARAGE[selectedCar].name;
  document.getElementById("league").innerText = currentLeague();
  document.getElementById("weather").innerText = WEATHERS[weatherIndex];

  localStorage.car = selectedCar;
  localStorage.points = points;
}

/* =========================================================
   DRAW LOOP
========================================================= */
function draw() {
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(140, 0, 200, canvas.height);

  if (replayMode) {
    const f = replay[replayIndex];
    if (f) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.a);
      ctx.fillStyle = "#ff0";
      ctx.fillRect(-15, -30, 30, 60);
      ctx.restore();
    }
  } else {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    ctx.fillStyle = GARAGE[selectedCar].color;
    ctx.fillRect(-15, -30, 30, 60);
    ctx.restore();
  }

  ctx.fillStyle = "blue";
  policeUnits.forEach(p => {
    if (p.active) ctx.fillRect(p.x - 10, p.y - 20, 20, 40);
  });
}

/* =========================================================
   MAIN LOOP
========================================================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

/* =========================================================
   INPUT BINDS
========================================================= */
document.getElementById("replayPlay").onclick = () => replayPlaying = !replayPlaying;
document.getElementById("replayCamera").onclick = () => cameraMode = (cameraMode + 1) % 3;
document.getElementById("replayExport").onclick = exportReplay;

document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "r") {
    replayMode = !replayMode;
    replayUI.style.display = replayMode ? "flex" : "none";
    crossfade(replayMode ? music.replay : music.drive);
  }
});
