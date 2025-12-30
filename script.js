/* =========================================================
   CORE SETUP
========================================================= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================================================
   CUTSCENE SYSTEM
========================================================= */
const cutscene = document.getElementById("cutscene");
const cutsceneText = document.getElementById("cutsceneText");
const skipCutscene = document.getElementById("skipCutscene");

const CUTSCENE_LINES = [
  "Hyderabad. Midnight.",
  "Street racers control the roads.",
  "Win races.",
  "Climb leagues.",
  "Escape the police."
];

let cutsceneIndex = 0;

function startCutscene() {
  cutscene.style.display = "flex";
  cutsceneText.innerText = CUTSCENE_LINES[cutsceneIndex];

  const interval = setInterval(() => {
    cutsceneIndex++;
    if (cutsceneIndex >= CUTSCENE_LINES.length) {
      clearInterval(interval);
      cutscene.style.display = "none";
    } else {
      cutsceneText.innerText = CUTSCENE_LINES[cutsceneIndex];
    }
  }, 2000);
}

skipCutscene.onclick = () => cutscene.style.display = "none";
startCutscene();

/* =========================================================
   LEAGUES & SEASONS
========================================================= */
const LEAGUES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
let globalPoints = Number(localStorage.globalPoints || 0);

function currentLeague() {
  return LEAGUES[Math.min(LEAGUES.length - 1, Math.floor(globalPoints / 100))];
}

const SEASON_DURATION = 30 * 24 * 60 * 60 * 1000;
const seasonId = Math.floor(Date.now() / SEASON_DURATION);
document.getElementById("season").innerText = "Season " + seasonId;

/* =========================================================
   WEATHER SYSTEM
========================================================= */
const WEATHER_TYPES = ["Clear", "Rain", "Fog"];
let weatherIndex = Math.floor(Math.random() * WEATHER_TYPES.length);

setInterval(() => {
  weatherIndex = Math.floor(Math.random() * WEATHER_TYPES.length);
}, 30000);

/* =========================================================
   MUSIC SYSTEM (DYNAMIC CROSSFADES)
========================================================= */
function createMusic(src) {
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0;
  return audio;
}

const music = {
  drive: createMusic("music_drive.mp3"),
  chase: createMusic("music_chase.mp3"),
  replay: createMusic("music_replay.mp3")
};

let currentMusic = music.drive;

function crossfade(next) {
  next.play().catch(() => {});
  let t = 0;
  const fade = setInterval(() => {
    t += 0.05;
    currentMusic.volume = Math.max(0, 0.6 - t);
    next.volume = Math.min(0.6, t);
    if (t >= 0.6) {
      currentMusic.pause();
      currentMusic = next;
      clearInterval(fade);
    }
  }, 50);
}

crossfade(music.drive);

/* =========================================================
   GARAGE & PLAYER
========================================================= */
const GARAGE = [
  { name: "Audi A3", color: "#111", accel: 0.25, grip: 0.93 },
  { name: "BMW 3 Series", color: "#eee", accel: 0.23, grip: 0.91 },
  { name: "Ferrari F8", color: "#c40000", accel: 0.35, grip: 0.88 }
];

let selectedCar = Number(localStorage.selectedCar || 0);

const car = {
  x: 240,
  y: 600,
  angle: 0,
  speed: 0,
  grip: GARAGE[selectedCar].grip
};

/* =========================================================
   POLICE AI (ADVANCED)
========================================================= */
let heat = 0;
const policeUnits = [
  { x: 200, y: -300, active: false },
  { x: 280, y: -600, active: false }
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
        globalPoints = Math.max(0, globalPoints - 50);
        p.active = false;
        crossfade(music.drive);
      }
    }
  });

  if (heat > 1) crossfade(music.chase);
}

/* =========================================================
   REPLAY SYSTEM
========================================================= */
let replay = [];
let replayMode = false;
let replayIndex = 0;
let replayPlaying = false;
let replaySpeed = 1;
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
   TOURNAMENT SYSTEM (SEASONAL)
========================================================= */
const TOURNAMENT_KEY = "tournament_" + seasonId;
let tournament = JSON.parse(localStorage.getItem(TOURNAMENT_KEY)) || {
  races: 0,
  points: 0
};

function finishRace(position = 0) {
  const pointsTable = [50, 30, 20, 10];
  const earned = pointsTable[position] || 5;
  tournament.points += earned;
  tournament.races++;
  globalPoints += earned;
  localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(tournament));
}

/* =========================================================
   PHYSICS UPDATE
========================================================= */
function updatePhysics() {
  car.grip =
    weatherIndex === 1 ? 0.85 :
    weatherIndex === 2 ? 0.88 :
    GARAGE[selectedCar].grip;

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
}

/* =========================================================
   DRAW
========================================================= */
function applyCamera() {
  if (cameraMode === 1) ctx.scale(1.2, 1.2);
  if (cameraMode === 2) ctx.translate(100, 60);
}

function draw() {
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(140, 0, 200, canvas.height);

  ctx.save();
  applyCamera();

  if (replayMode) {
    const f = replay[Math.floor(replayIndex)];
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

  ctx.restore();

  ctx.fillStyle = "blue";
  policeUnits.forEach(p => {
    if (p.active) ctx.fillRect(p.x - 10, p.y - 20, 20, 40);
  });
}

/* =========================================================
   MAIN LOOP
========================================================= */
function loop() {
  if (replayMode) {
    if (replayPlaying) {
      replayIndex += replaySpeed;
      if (replayIndex >= replay.length) replayPlaying = false;
      replaySlider.value = replayIndex;
    }
  } else {
    updatePhysics();
    captureReplay();
    updatePolice();
  }

  draw();

  document.getElementById("speed").innerText =
    Math.abs(car.speed * 12 | 0) + " km/h";
  document.getElementById("carName").innerText = GARAGE[selectedCar].name;
  document.getElementById("league").innerText = currentLeague();
  document.getElementById("weather").innerText = WEATHER_TYPES[weatherIndex];

  localStorage.selectedCar = selectedCar;
  localStorage.globalPoints = globalPoints;

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
  if (e.key.toLowerCase() === "m") {
    Object.values(music).forEach(m => m.muted = !m.muted);
  }
});

/* =========================================================
   MOBILE CONTROLS
========================================================= */
document.getElementById("btnGas").ontouchstart = () => keys["w"] = true;
document.getElementById("btnGas").ontouchend = () => keys["w"] = false;
document.getElementById("btnBrake").ontouchstart = () => keys["s"] = true;
document.getElementById("btnBrake").ontouchend = () => keys["s"] = false;
document.getElementById("btnDrift").ontouchstart = () => keys[" "] = true;
document.getElementById("btnDrift").ontouchend = () => keys[" "] = false;

/* =========================================================
   SAFETY
========================================================= */
window.addEventListener("blur", () => {
  Object.keys(keys).forEach(k => keys[k] = false);
});

console.log("Hyderabad Open-World Racer loaded successfully");
