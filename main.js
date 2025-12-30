import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";

/* ===============================
   BASIC SETUP
================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* ===============================
   LIGHTING (DAY / NIGHT)
================================ */
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(200, 300, 200);
sun.castShadow = true;
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

let timeOfDay = 0; // 0 → day, 1 → night

/* ===============================
   GROUND & ROADS (HYDERABAD STYLE)
================================ */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x1f1f1f })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function createRoad(x, z, w, h) {
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.02, z);
  scene.add(road);
}

createRoad(0, 0, 20, 2000);
createRoad(100, 0, 20, 2000);
createRoad(-100, 0, 20, 2000);
createRoad(0, 200, 300, 20);
createRoad(0, -300, 300, 20);

/* ===============================
   PLAYER CAR
================================ */
const car = new THREE.Group();

const carBody = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.8, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
carBody.castShadow = true;
car.add(carBody);

scene.add(car);
car.position.set(0, 0.4, 0);

let speed = 0;
let rotation = 0;

/* ===============================
   AI TRAFFIC
================================ */
const traffic = [];

function spawnTraffic(x, z) {
  const t = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  t.position.set(x, 0.4, z);
  t.userData.speed = 0.3 + Math.random() * 0.4;
  scene.add(t);
  traffic.push(t);
}

for (let i = 0; i < 10; i++) {
  spawnTraffic(0, -400 + i * 80);
}

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

  /* Car physics */
  if (keys["w"]) speed += 0.03;
  if (keys["s"]) speed -= 0.04;
  speed *= 0.98;
  speed = Math.max(-1, Math.min(2, speed));

  if (keys["a"]) rotation += 0.04;
  if (keys["d"]) rotation -= 0.04;

  car.rotation.y = rotation;
  car.position.x += Math.sin(rotation) * speed;
  car.position.z += Math.cos(rotation) * speed;

  /* Camera (GTA third person) */
  const camOffset = new THREE.Vector3(
    Math.sin(rotation) * -10,
    6,
    Math.cos(rotation) * -10
  );
  camera.position.copy(car.position.clone().add(camOffset));
  camera.lookAt(car.position);

  /* Traffic movement */
  traffic.forEach(t => {
    t.position.z += t.userData.speed;
    if (t.position.z > car.position.z + 600) {
      t.position.z = car.position.z - 800;
    }
  });

  /* Police logic */
  if (Math.abs(speed) > 1.2) heat += 0.01;
  if (heat > 1) {
    police.position.lerp(car.position, 0.02);
    document.getElementById("status").innerText = "Police Chase!";
  } else {
    document.getElementById("status").innerText = "Free Roam";
  }

  /* Day / Night */
  timeOfDay += 0.0005;
  const nightFactor = (Math.sin(timeOfDay) + 1) / 2;
  sun.intensity = 1.2 * nightFactor;
  ambient.intensity = 0.2 + nightFactor * 0.4;
  document.getElementById("time").innerText = nightFactor > 0.5 ? "Day" : "Night";

  /* HUD */
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
