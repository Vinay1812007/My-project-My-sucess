/* =====================================================
   SCENE SETUP
===================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 5000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* =====================================================
   LIGHTING (STRONG, SAFE)
===================================================== */
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(200, 400, 200);
sun.castShadow = true;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

/* =====================================================
   GROUND
===================================================== */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* =====================================================
   ROAD
===================================================== */
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 4000),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
scene.add(road);

/* =====================================================
   LOAD BMW MODEL (AUTO FIXED)
===================================================== */
const loader = new THREE.GLTFLoader();
let car;

loader.load(
  "./assets/cars/bmw.glb",
  gltf => {
    car = gltf.scene;

    // Center model
    const box = new THREE.Box3().setFromObject(car);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    car.position.sub(center);

    // Scale to realistic size
    const scale = 4 / Math.max(size.x, size.z);
    car.scale.setScalar(scale);

    // Place on ground
    car.position.y = 0.35;

    car.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    scene.add(car);
  },
  undefined,
  error => {
    console.error("GLB load failed", error);
  }
);

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

/* =====================================================
   GAME LOOP
===================================================== */
function animate() {
  requestAnimationFrame(animate);
  if (!car) return;

  // Acceleration
  if (keys["w"] || keys["arrowup"]) speed += 0.04;
  if (keys["s"] || keys["arrowdown"]) speed -= 0.05;

  speed *= 0.96;
  speed = Math.max(-1.5, Math.min(2.5, speed));

  // Steering
  if (keys["a"] || keys["arrowleft"]) rotation += 0.04 * speed;
  if (keys["d"] || keys["arrowright"]) rotation -= 0.04 * speed;

  car.rotation.y = rotation;
  car.position.x += Math.sin(rotation) * speed;
  car.position.z += Math.cos(rotation) * speed;

  // Camera (GTA style)
  const camOffset = new THREE.Vector3(
    Math.sin(rotation) * -16,
    8,
    Math.cos(rotation) * -16
  );
  camera.position.copy(car.position.clone().add(camOffset));
  camera.lookAt(car.position);

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
