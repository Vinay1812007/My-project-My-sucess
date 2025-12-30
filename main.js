import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js";

/* ===============================
   SCENE SETUP
================================ */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x202020, 50, 500);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* ===============================
   LIGHTING
================================ */
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(200, 300, 200);
sun.castShadow = true;
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

let timeOfDay = 0;

/* ===============================
   GROUND & ROADS
================================ */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x1f1f1f })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function road(x, z, w, h) {
  const r = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
  );
  r.rotation.x = -Math.PI / 2;
  r.position.set(x, 0.02, z);
  scene.add(r);
}

road(0, 0, 20, 2000);
road(100, 0, 20, 2000);
road(-100, 0, 20, 2000);
road(0, 200, 300, 20);
road(0, -300, 300, 20);

/* ===============================
   CITY BUILDINGS
================================ */
for (let i = 0; i < 120; i++) {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(10, Math.random() * 40 + 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  b.position.set(
    Math.random() * 600 - 300,
    b.geometry.parameters.height / 2,
    Math.random() * 600 - 300
  );
  b.castShadow = true;
  b.receiveShadow = true;
  scene.add(b);
}

/* ===============================
   PLAYER CAR (GLTF READY)
================================ */
let car;
const loader = new GLTFLoader();

loader.load(
  "./assets/cars/car.glb",
  gltf => {
    car = gltf.scene;
    car.scale.set(1.2, 1.2, 1.2);
    car.position.set(0, 0.4, 0);
    car.traverse(o => o.castShadow = true);
    scene.add(car);
  },
  undefined,
  () => {
    car = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 4),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    car.position.set(0, 0.4, 0);
    car.castShadow = true;
    scene.add(car);
  }
);

let speed = 0;
let rotation = 0;

/* ===============================
   TRAFFIC AI
================================ */
const traffic = [];

function spawnTraffic(z) {
  const t = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  t.position.set(0, 0.4, z);
  t.userData.speed = 0.4 + Math.random() * 0.4;
  scene.add(t);
  traffic.push(t);
}

for (let i = 0; i < 12; i++) spawnTraffic(-500 + i * 80);

/* ===============================
   POLICE AI
================================ */
const police = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.8, 4),
  new THREE.MeshStandardMaterial({ color: 0x0033ff })
);
police.position.set(50, 0.4, -200);
scene.add(police);

let heat = 0;

/* ===============================
   RAIN SYSTEM
================================ */
let rainEnabled = false;
const rain = [];

function startRain() {
  rainEnabled = true;
  document.getElementById("weather").innerText = "Rain";
  for (let i = 0; i < 800; i++) {
    const drop = new THREE.Mesh(
      new THREE.SphereGeometry(0.05),
      new THREE.MeshBasicMaterial({ color: 0x88aaff })
    );
    drop.position.set(
      Math.random() * 600 - 300,
      Math.random() * 200,
      Math.random() * 600 - 300
    );
    scene.add(drop);
    rain.push(drop);
  }
}

setTimeout(startRain, 15000);

/* ===============================
   INPUT
================================ */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* ===============================
   GAME LOOP
================================ */
function animate() {
  requestAnimationFrame(animate);
  if (!car) return;

  /* Car physics */
  if (keys["w"]) speed += 0.03;
  if (keys["s"]) speed -= 0.04;
  speed *= rainEnabled ? 0.96 : 0.98;
  speed = Math.max(-1, Math.min(2, speed));

  if (keys["a"]) rotation += 0.04;
  if (keys["d"]) rotation -= 0.04;

  car.rotation.y = rotation;
  car.position.x += Math.sin(rotation) * speed;
  car.position.z += Math.cos(rotation) * speed;

  /* Camera */
  const camOffset = new THREE.Vector3(
    Math.sin(rotation) * -12,
    6,
    Math.cos(rotation) * -12
  );
  camera.position.copy(car.position.clone().add(camOffset));
  camera.lookAt(car.position);

  /* Traffic */
  traffic.forEach(t => {
    t.position.z += t.userData.speed;
    if (t.position.z > car.position.z + 500) {
      t.position.z = car.position.z - 800;
    }
  });

  /* Police chase */
  if (Math.abs(speed) > 1.2) heat += 0.01;
  if (heat > 1) {
    police.position.lerp(car.position, 0.03);
    document.getElementById("status").innerText = "Police Chase!";
  } else {
    document.getElementById("status").innerText = "Free Roam";
  }

  /* Rain animation */
  rain.forEach(d => {
    d.position.y -= 1;
    if (d.position.y < 0) d.position.y = 200;
  });

  /* Day / Night */
  timeOfDay += 0.0004;
  const daylight = (Math.sin(timeOfDay) + 1) / 2;
  sun.intensity = 1.2 * daylight;
  ambient.intensity = 0.2 + daylight * 0.4;
  document.getElementById("time").innerText = daylight > 0.5 ? "Day" : "Night";

  document.getElementById("speed").innerText =
    Math.abs(speed * 120).toFixed(0) + " km/h";

  renderer.render(scene, camera);
}

animate();

/* ===============================
   RESIZE
================================ */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
