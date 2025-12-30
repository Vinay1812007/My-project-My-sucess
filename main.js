/* ================= SCENE ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 5000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* ================= LIGHT ================= */
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(200, 400, 200);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

/* ================= GROUND ================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ================= ROAD ================= */
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 4000),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
scene.add(road);

/* ================= HUD ================= */
const speedEl = document.getElementById("speed");

/* ================= CAR ================= */
const loader = new THREE.GLTFLoader();
let car;

/* Fallback cube (ALWAYS visible) */
function fallbackCar() {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  box.position.set(0, 0.5, 0);
  box.castShadow = true;
  scene.add(box);
  return box;
}

car = fallbackCar();

/* Load BMW */
loader.load(
  "./assets/cars/bmw.glb",
  gltf => {
    scene.remove(car);
    car = gltf.scene;

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
  },
  undefined,
  e => console.error("BMW load error", e)
);

/* ================= INPUT ================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* ================= DRIVE ================= */
let speed = 0;
let rot = 0;

function animate() {
  requestAnimationFrame(animate);
  if (!car) return;

  if (keys["w"] || keys["arrowup"]) speed += 0.04;
  if (keys["s"] || keys["arrowdown"]) speed -= 0.05;

  speed *= 0.96;
  speed = Math.max(-1.5, Math.min(2.5, speed));

  if (keys["a"] || keys["arrowleft"]) rot += 0.04 * speed;
  if (keys["d"] || keys["arrowright"]) rot -= 0.04 * speed;

  car.rotation.y = rot;
  car.position.x += Math.sin(rot) * speed;
  car.position.z += Math.cos(rot) * speed;

  const camOffset = new THREE.Vector3(
    Math.sin(rot) * -16, 8, Math.cos(rot) * -16
  );
  camera.position.copy(car.position.clone().add(camOffset));
  camera.lookAt(car.position);

  speedEl.innerText = Math.abs(speed * 120).toFixed(0) + " km/h";

  renderer.render(scene, camera);
}

animate();

/* ================= RESIZE ================= */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
