import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- CONFIG ---
const LANE_WIDTH = 3;
const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];
let currentLane = 1;
let speed = 0.5;
let score = 0;
let gameOver = false;
let obstacles = [];

// --- SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510); // Deep dark blue
scene.fog = new THREE.Fog(0x050510, 10, 60);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 8);
camera.lookAt(0, 0, -5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- LIGHTS ---
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Very bright ambient
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xff00ff, 10);
spotLight.position.set(0, 10, 0);
spotLight.angle = 0.5;
scene.add(spotLight);

// --- ROAD ---
// Neon Grid Road
const roadGeo = new THREE.PlaneGeometry(20, 2000);
const roadMat = new THREE.MeshPhongMaterial({ 
    color: 0x111111, 
    emissive: 0x220022 
});
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.z = -500;
scene.add(road);

// Grid Helper (Retro Vibe)
const grid = new THREE.GridHelper(200, 100, 0xff0055, 0x220044);
grid.position.z = -50;
scene.add(grid);

// --- PLAYER ---
const playerContainer = new THREE.Group();
scene.add(playerContainer);

// FALLBACK BOX (If car fails to load, you will see this Blue Box)
const boxGeo = new THREE.BoxGeometry(1.5, 1, 3);
const boxMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
const fallbackCar = new THREE.Mesh(boxGeo, boxMat);
fallbackCar.position.y = 0.5;
playerContainer.add(fallbackCar);

// LOAD REAL CAR
const loader = new GLTFLoader();

// ** IMPORTANT: Tries to load from 'assets/' folder first **
loader.load('assets/bmw.glb', (gltf) => {
    console.log("CAR LOADED!");
    playerContainer.remove(fallbackCar); // Remove the box

    const model = gltf.scene;

    // --- FORCE VISIBILITY LOGIC ---
    
    // 1. Calculate the REAL center and size of the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 2. Center the model (Subtract the offset)
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;

    // 3. Scale it (Force it to be ~3 units big)
    const maxDim = Math.max(size.x, size.y, size.z);
    if(maxDim > 0) {
        const scaleFactor = 3.0 / maxDim;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    // 4. Force Neon Material (Ensures it is visible even if lighting breaks)
    const neonMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,      // Cyan
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x0044aa,   // Glows blue
        emissiveIntensity: 0.5
    });

    model.traverse((child) => {
        if (child.isMesh) {
            child.material = neonMat; // Apply neon paint
            child.castShadow = true;
        }
    });

    // 5. Rotate & Lift
    playerContainer.rotation.y = Math.PI; // Face forward
    playerContainer.position.y = 0.5;
    
    playerContainer.add(model);

}, undefined, (error) => {
    console.error("Car load failed. Check path.", error);
    // If it fails, we just keep the Blue Wireframe Box
});


// --- INPUT ---
window.addEventListener('keydown', (e) => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft' && currentLane > 0) currentLane--;
    if (e.key === 'ArrowRight' && currentLane < 2) currentLane++;
});

// --- GAME LOOP ---
function animate() {
    if (gameOver) return;
    requestAnimationFrame(animate);

    // 1. Move Car Smoothly
    const targetX = LANES[currentLane];
    playerContainer.position.x += (targetX - playerContainer.position.x) * 0.15;
    playerContainer.rotation.z = (playerContainer.position.x - targetX) * 0.1; // Tilt

    // 2. Spawn Obstacles
    if (Math.random() < 0.03) {
        spawnObstacle();
    }

    // 3. Move Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.position.z += speed;

        // Collision (Simple distance check)
        if (obs.position.z > -2 && obs.position.z < 2) {
            if (Math.abs(obs.position.x - playerContainer.position.x) < 1.5) {
                // HIT!
                gameOver = true;
                document.body.innerHTML += `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:50px;background:red;padding:20px;">GAME OVER<br><small>Refresh to restart</small></div>`;
            }
        }

        // Cleanup
        if (obs.position.z > 10) {
            scene.remove(obs);
            obstacles.splice(i, 1);
            score += 10;
            document.getElementById('score').innerText = score;
            speed += 0.001;
        }
    }

    // 4. Move Road Texture
    grid.position.z += speed;
    if (grid.position.z > 0) grid.position.z = -50;

    renderer.render(scene, camera);
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0000 });
    const obs = new THREE.Mesh(geo, mat);
    obs.position.set(LANES[lane], 1, -100);
    scene.add(obs);
    obstacles.push(obs);
}

// Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
