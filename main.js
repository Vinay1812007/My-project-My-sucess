/* =====================================================
   BASIC THREE SETUP (NO MODULES)
===================================================== */
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

/* =====================================================
   LIGHTING (FORCED VISIBILITY)
===================================================== */
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(100, 200, 100);
sun.castShadow = true;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

/* =====================================================
   GROUND & ROAD (ALWAYS VISIBLE)
===================================================== */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x1f1f1f })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 2000),
  new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
scene.add(road);

/* =====================================================
   PLAYER CAR (ALWAYS EXISTS)
===================================================== */
const car = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.8, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
car.position.set(0, 0.4, 0);
car.castShadow = true;
scene.add(car);

/* =====================================================
   CAMERA (GTA STYLE)
===================================================== */
camera.position.set(0, 6, -12);
camera.lookAt(car.position);

/* =====================================================
   INPUT (WASD + ARROWS)
===================================================== */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =====================================================
   GAME STATE
===================================================== */
let speed = 0;
let rotation = 0;
let heat = 0;
let timeOfDay = 0;

/* =====================================================
   GAME LOOP
===================================================== */
function animate() {
  requestAnimationFrame(animate);

  /* GAS */
  if (keys["w"] || keys["arrowup"]) speed += 0.03;
  if (keys["s"] || keys["arrowdown"]) speed -= 0.04;

  speed *= 0.98;
  speed = Math.max(-1, Math.min(2, speed));

  /* STEERING */
  if (keys["a"] || keys["arrowleft"]) rotation += 0.04;
  if (keys["d"] || keys["arrowright"]) rotation -= 0.04;

  car.rotation.y = rotation;
  car.position.x += Math.sin(rotation) * speed;
  car.position.z += Math.cos(rotation) * speed;

  /* CAMERA FOLLOW */
  const camOffset = new THREE.Vector3(
    Math.sin(rotation) * -12,
    6,
    Math.cos(rotation) * -12
  );
  camera.position.copy(car.position.clone().add(camOffset));
  camera.lookAt(car.position);

  /* DAY / NIGHT */
  timeOfDay += 0.0005;
  const daylight = (Math.sin(timeOfDay) + 1) / 2;
  sun.intensity = 1.2 * daylight;
  document.getElementById("time").innerText =
    daylight > 0.5 ? "Day" : "Night";

  /* POLICE HEAT (LOGIC READY) */
  if (Math.abs(speed) > 1.2) {
    heat += 0.01;
    document.getElementById("status").innerText = "Speeding";
  } else {
    document.getElementById("status").innerText = "Free Roam";
  }

  document.getElementById("speed").innerText =
    Math.abs(speed * 120).toFixed(0) + " km/h";

  renderer.render(scene, camera);
}

animate();

/* =====================================================
   RESIZE
===================================================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
