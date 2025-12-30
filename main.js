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
   CAMERA (LOCKED SAFE)
========================= */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 6, 15);
camera.lookAt(0, 0, 0);

/* =========================
   LIGHTS (VERY BRIGHT)
========================= */
scene.add(new THREE.AmbientLight(0xffffff, 1));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

/* =========================
   GROUND (VISIBLE)
========================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshBasicMaterial({ color: 0x444444 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* =========================
   RED TEST CAR (100% VISIBLE)
========================= */
let car = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
car.position.y = 0.5;
scene.add(car);

/* =========================
   LOAD BMW (SAFE)
========================= */
const loader = new THREE.GLTFLoader();
loader.load(
  "assets/cars/bmw.glb",
  function (gltf) {
    scene.remove(car);
    car = gltf.scene;

    car.scale.set(2, 2, 2);
    car.position.set(0, 0, 0);

    scene.add(car);
  },
  undefined,
  function (error) {
    console.error("GLB LOAD FAILED — cube stays", error);
  }
);

/* =========================
   INPUT
========================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================
   GAME LOOP
========================= */
let speed = 0;
let rotation = 0;

function animate() {
  requestAnimationFrame(animate);

  if (keys["w"] || keys["arrowup"]) speed += 0.03;
  if (keys["s"] || keys["arrowdown"]) speed -= 0.03;
  speed *= 0.95;

  if (keys["a"] || keys["arrowleft"]) rotation += 0.04;
  if (keys["d"] || keys["arrowright"]) rotation -= 0.04;

  car.rotation.y = rotation;
  car.position.x += Math.sin(rotation) * speed;
  car.position.z += Math.cos(rotation) * speed;

  camera.position.x = car.position.x + Math.sin(rotation) * -12;
  camera.position.z = car.position.z + Math.cos(rotation) * -12;
  camera.position.y = 6;
  camera.lookAt(car.position);

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
