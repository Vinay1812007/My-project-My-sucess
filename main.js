/* =========================
   IMPORTS (CORRECT WAY)
========================= */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js";

/* =========================
   RENDERER
========================= */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x222222);
document.body.appendChild(renderer.domElement);

/* =========================
   SCENE
========================= */
const scene = new THREE.Scene();

/* =========================
   CAMERA (SAFE POSITION)
========================= */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 8, 18);
camera.lookAt(0, 0, 0);

/* =========================
   LIGHT
========================= */
scene.add(new THREE.AmbientLight(0xffffff, 1));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

/* =========================
   GROUND
========================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* =========================
   FALLBACK CUBE (ALWAYS VISIBLE)
========================= */
const fallback = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
fallback.position.set(0, 0.5, 0);
scene.add(fallback);

/* =========================
   LOAD BMW MODEL (CORRECT)
========================= */
const loader = new GLTFLoader();

loader.load(
  "./assets/cars/bmw.glb",
  (gltf) => {
    scene.remove(fallback);

    const car = gltf.scene;

    const box = new THREE.Box3().setFromObject(car);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    car.position.sub(center);
    car.scale.setScalar(4 / Math.max(size.x, size.z));
    car.position.y = 0.35;

    car.traverse(m => {
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });

    scene.add(car);
    currentCar = car;
  },
  undefined,
  (err) => console.error("GLB load failed", err)
);

/* =========================
   INPUT
========================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================
   DRIVE
========================= */
let speed = 0;
let rotation = 0;
let currentCar = fallback;

function animate() {
  requestAnimationFrame(animate);

  if (keys["w"] || keys["arrowup"]) speed += 0.03;
  if (keys["s"] || keys["arrowdown"]) speed -= 0.04;
  speed *= 0.95;

  if (keys["a"] || keys["arrowleft"]) rotation += 0.03 * speed;
  if (keys["d"] || keys["arrowright"]) rotation -= 0.03 * speed;

  currentCar.rotation.y = rotation;
  currentCar.position.x += Math.sin(rotation) * speed;
  currentCar.position.z += Math.cos(rotation) * speed;

  camera.position.x = currentCar.position.x + Math.sin(rotation) * -14;
  camera.position.z = currentCar.position.z + Math.cos(rotation) * -14;
  camera.position.y = 7;
  camera.lookAt(currentCar.position);

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
