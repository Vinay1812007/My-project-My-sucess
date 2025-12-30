import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";

/* ===========================
   SCENE SETUP
=========================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* ===========================
   LIGHTING (GTA-LIKE)
=========================== */
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(100, 200, 100);
sun.castShadow = true;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));

/* ===========================
   GROUND / ROAD
=========================== */
const groundGeo = new THREE.PlaneGeometry(500, 500);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* Road */
const roadGeo = new THREE.PlaneGeometry(20, 500);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.01;
scene.add(road);

/* ===========================
   CAR (TEMP PRIMITIVE — REAL MODEL NEXT)
=========================== */
const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.8, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
body.castShadow = true;
car.add(body);

scene.add(car);
car.position.set(0, 0.4, 0);

/* ===========================
   CAMERA (GTA THIRD-PERSON)
=========================== */
camera.position.set(0, 5, -10);

/* ===========================
   CONTROLS
=========================== */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let speed = 0;
let rotation = 0;

/* ===========================
   GAME LOOP
=========================== */
function animate() {
  requestAnimationFrame(animate);

  /* Movement */
  if (keys["w"]) speed += 0.02;
  if (keys["s"]) speed -= 0.02;
  speed *= 0.98;
  speed = Math.max(-0.5, Math.min(1.5, speed));

  if (keys["a"]) rotation += 0.03;
  if (keys["d"]) rotation -= 0.03;

  car.rotation.y = rotation;
  car.position.x += Math.sin(rotation) * speed;
  car.position.z += Math.cos(rotation) * speed;

  /* Camera follow (GTA style) */
  const camOffset = new THREE.Vector3(
    Math.sin(rotation) * -10,
    5,
    Math.cos(rotation) * -10
  );
  camera.position.copy(car.position.clone().add(camOffset));
  camera.lookAt(car.position);

  /* HUD */
  document.getElementById("speed").innerText =
    Math.abs(speed * 120).toFixed(0) + " km/h";

  renderer.render(scene, camera);
}

animate();

/* ===========================
   RESIZE
=========================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
