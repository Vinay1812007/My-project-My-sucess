/* =====================================================
   SCENE SETUP
===================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 3000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* =====================================================
   LIGHTING
===================================================== */
const sun = new THREE.DirectionalLight(0xffffff, 1.3);
sun.position.set(150, 300, 150);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

/* =====================================================
   GROUND & ROAD
===================================================== */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.MeshStandardMaterial({ color: 0x1b1b1b })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 2000),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
scene.add(road);

/* =====================================================
   CAR SYSTEM (MULTI GLTF)
===================================================== */
const loader = new THREE.GLTFLoader();

const CAR_DEFS = {
  audi: { file: "audi.glb", scale: 1.2 },
  bmw: { file: "bmw.glb", scale: 1.2 },
  ferrari: { file: "ferrari.glb", scale: 1.2 }
};

let car = null;
let currentCar = "audi";

function loadCar(type) {
  if (car) scene.remove(car);

  const def = CAR_DEFS[type];
  document.getElementById("carName").innerText = type.toUpperCase();

  loader.load(
    `./assets/cars/${def.file}`,
    gltf => {
      car = gltf.scene;
      car.scale.setScalar(def.scale);
      car.position.set(0, 0.4, 0);
      car.traverse(o => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      scene.add(car);
    },
    undefined,
    () => {
      // fallback box (never breaks game)
      car = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.9, 4),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      car.position.set(0, 0.45, 0);
      scene.add(car);
    }
  );
}

loadCar(currentCar);

/* =====================================================
   INPUT
===================================================== */
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === "1") { currentCar = "audi"; loadCar("audi"); }
  if (e.key === "2") { currentCar = "bmw"; loadCar("bmw"); }
  if (e.key === "3") { currentCar = "ferrari"; loadCar("ferrari"); }
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =====================================================
   GAME STATE
===================================================== */
let speed = 0;
let rotation = 0;
let timeOfDay = 0;

/* =====================================================
   GAME LOOP
===================================================== */
function animate() {
  requestAnimationFrame(animate);
  if (!car) return;

  /* Driving */
  if (keys["w"] || keys["arrowup"]) speed += 0.035;
  if (keys["s"] || keys["arrowdown"]) speed -= 0.045;

  speed *= 0.97;
  speed = Math.max(-1.2, Math.min(2.4, speed));

  if (keys["a"] || keys["arrowleft"]) rotation += 0.04 * (speed / 2);
  if (keys["d"] || keys["arrowright"]) rotation -= 0.04 * (speed / 2);

  car.rotation.y = rotation;
  car.position.x += Math.sin(rotation) * speed;
  car.position.z += Math.cos(rotation) * speed;

  /* Camera */
  const camOffset = new THREE.Vector3(
    Math.sin(rotation) * -14,
    7,
    Math.cos(rotation) * -14
  );
  camera.position.copy(car.position.clone().add(camOffset));
  camera.lookAt(car.position);

  /* Day / Night */
  timeOfDay += 0.0005;
  const daylight = (Math.sin(timeOfDay) + 1) / 2;
  sun.intensity = 1.3 * daylight;
  document.getElementById("time").innerText =
    daylight > 0.5 ? "Day" : "Night";

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
