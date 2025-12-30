/* =========================
   SCENE SETUP
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 3000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* =========================
   LIGHTING
========================= */
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(150, 300, 150);
sun.castShadow = true;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

/* =========================
   GROUND & ROADS
========================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.MeshStandardMaterial({ color: 0x1b1b1b })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

function road(x, z, w, h) {
  const r = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  r.rotation.x = -Math.PI / 2;
  r.position.set(x, 0.02, z);
  scene.add(r);

  // lane markings
  for (let i = -h / 2; i < h / 2; i += 20) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.03, z + i);
    scene.add(line);
  }
}

road(0, 0, 18, 2000);
road(80, 0, 18, 2000);
road(-80, 0, 18, 2000);
road(0, 200, 300, 18);

/* =========================
   BUILDINGS
========================= */
for (let i = 0; i < 120; i++) {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(12, Math.random() * 40 + 15, 12),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  b.position.set(
    Math.random() * 600 - 300,
    b.geometry.parameters.height / 2,
    Math.random() * 600 - 300
  );
  scene.add(b);
}

/* =========================
   PLAYER CAR
========================= */
const car = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.9, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
car.position.set(0, 0.45, 0);
scene.add(car);

let speed = 0;
let rotation = 0;

/* =========================
   TRAFFIC AI
========================= */
const traffic = [];

function spawnTraffic(z) {
  const t = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  t.position.set(80, 0.4, z);
  t.userData.speed = 0.4 + Math.random() * 0.4;
  scene.add(t);
  traffic.push(t);
}

for (let i = 0; i < 10; i++) spawnTraffic(-500 + i * 100);

/* =========================
   POLICE AI
========================= */
const police = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.9, 4),
  new THREE.MeshStandardMaterial({ color: 0x0033ff })
);
police.position.set(-60, 0.45, -200);
scene.add(police);

let heat = 0;

/* =========================
   INPUT
========================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================
   GAME LOOP
========================= */
let timeOfDay = 0;

function animate() {
  requestAnimationFrame(animate);

  /* Acceleration */
  if (keys["w"] || keys["arrowup"]) speed += 0.035;
  if (keys["s"] || keys["arrowdown"]) speed -= 0.045;

  speed *= 0.97;
  speed = Math.max(-1.2, Math.min(2.2, speed));

  /* Steering */
  if (keys["a"] || keys["arrowleft"]) rotation += 0.04 * (speed / 2);
  if (keys["d"] || keys["arrowright"]) rotation -= 0.04 * (speed / 2);

  car.rotation.y = rotation;
  car.position.x += Math.sin(rotation) * speed;
  car.position.z += Math.cos(rotation) * speed;

  /* Camera follow */
  const camOffset = new THREE.Vector3(
    Math.sin(rotation) * -14,
    7,
    Math.cos(rotation) * -14
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

  /* Police chase */
  if (Math.abs(speed) > 1.4) heat += 0.015;
  if (heat > 1) {
    police.position.lerp(car.position, 0.035);
    document.getElementById("status").innerText = "Police Chase!";
  } else {
    document.getElementById("status").innerText = "Free Roam";
  }

  /* Day / Night */
  timeOfDay += 0.0005;
  const daylight = (Math.sin(timeOfDay) + 1) / 2;
  sun.intensity = 1.3 * daylight;
  document.getElementById("time").innerText =
    daylight > 0.5 ? "Day" : "Night";

  /* HUD */
  document.getElementById("speed").innerText =
    Math.abs(speed * 120).toFixed(0) + " km/h";

  renderer.render(scene, camera);
}

animate();

/* =========================
   RESIZE
========================= */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
