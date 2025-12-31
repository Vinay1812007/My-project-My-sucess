import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0c0);
scene.fog = new THREE.Fog(0xa0a0c0, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lights ---
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(0, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// --- Game Variables ---
let playerCar;
let speed = 0.2;
let score = 0;
let gameOver = false;
const lanePositions = [-2, 0, 2]; // Left, Center, Right
let currentLane = 1; // Start in center
let obstacles = [];

// --- Load Your BMW ---
const loader = new GLTFLoader();
loader.load('assets/bmw.glb', function (gltf) {
    playerCar = gltf.scene;
    playerCar.scale.set(0.5, 0.5, 0.5); // Adjust if car is too big/small
    playerCar.rotation.y = Math.PI; // Face away from camera
    scene.add(playerCar);
    
    // Start game loop only after car loads
    animate();
}, undefined, function (error) {
    console.error(error);
});

// --- Create Road ---
const roadGeo = new THREE.PlaneGeometry(10, 1000);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
scene.add(road);

// --- Input Handling ---
window.addEventListener('keydown', (e) => {
    if (gameOver || !playerCar) return;
    
    if (e.key === 'ArrowLeft' && currentLane > 0) {
        currentLane--;
    } else if (e.key === 'ArrowRight' && currentLane < 2) {
        currentLane++;
    }
});

// --- Obstacle Logic ---
function spawnObstacle() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const obstacle = new THREE.Mesh(geometry, material);
    
    // Pick random lane
    const lane = Math.floor(Math.random() * 3);
    obstacle.position.set(lanePositions[lane], 0.5, -50);
    
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// --- Main Loop ---
function animate() {
    if (gameOver) return;
    requestAnimationFrame(animate);

    // Smoothly move car to target lane
    if (playerCar) {
        playerCar.position.x += (lanePositions[currentLane] - playerCar.position.x) * 0.1;
    }

    // Move Obstacles
    if (Math.random() < 0.02) spawnObstacle();

    obstacles.forEach((obs, index) => {
        obs.position.z += speed; // Move obstacle towards camera

        // Collision Check
        if (playerCar) {
            const dist = playerCar.position.distanceTo(obs.position);
            if (dist < 1.0) { // Hit!
                gameOver = true;
                document.getElementById('game-over').style.display = 'block';
            }
        }

        // Remove if behind camera
        if (obs.position.z > 5) {
            scene.remove(obs);
            obstacles.splice(index, 1);
            score++;
            document.getElementById('score').innerText = score;
            speed += 0.001; // Increase speed
        }
    });

    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
