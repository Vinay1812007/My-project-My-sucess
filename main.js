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
   CAMERA (FORCED SAFE)
========================= */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

/* =========================
   LIGHT (VERY BRIGHT)
========================= */
const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(10, 20, 10);
scene.add(dir);

/* =========================
   DEBUG HELPERS (MUST SEE)
========================= */
scene.add(new THREE.AxesHelper(5));

/* =========================
   GROUND (VISIBLE)
========================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* =========================
   TEST CUBE (GUARANTEED)
========================= */
const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 4),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
testCube.position.set(0, 1, 0);
scene.add(testCube);

/* =========================
   TRY LOAD BMW (OPTIONAL)
========================= */
const loader = new THREE.GLTFLoader();
loader.load(
  "./assets/cars/bmw.glb",
  gltf => {
    const car = gltf.scene;
    car.position.set(0, 0, 0);
    car.scale.set(2, 2, 2);
    scene.add(car);
  },
  undefined,
  e => console.warn("BMW failed, cube still visible", e)
);

/* =========================
   INPUT
========================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================
   LOOP
========================= */
let speed = 0;

function animate() {
  requestAnimationFrame(animate);

  if (keys["w"] || keys["arrowup"]) speed += 0.02;
  if (keys["s"] || keys["arrowdown"]) speed -= 0.02;
  speed *= 0.95;

  testCube.position.z -= speed;
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
