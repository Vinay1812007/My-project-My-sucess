import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e); 

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 8); // Camera high and back
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- LIGHTS ---
const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// --- GAME VARIABLES ---
let playerContainer = new THREE.Group(); // We move this group, not the car directly
scene.add(playerContainer);

let speed = 0.5;
let lane = 1; // 0=Left, 1=Center, 2=Right
const lanes = [-3.5, 0, 3.5]; 
let obstacles = [];
let gameOver = false;

// --- CRITICAL FIX: MANUALLY LOADING THE CAR ---
const loader = new GLTFLoader();

// 1. ADD A RED BOX FIRST (So you see SOMETHING if the file fails)
const fallbackGeo = new THREE.BoxGeometry(2, 1, 4);
const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const fallbackCar = new THREE.Mesh(fallbackGeo, fallbackMat);
fallbackCar.position.y = 0.5;
playerContainer.add(fallbackCar); // Add box initially

// 2. ATTEMPT TO LOAD THE REAL CAR
loader.load('assets/bmw.glb', function (gltf) {
    console.log("Car Loaded Successfully!");
    
    // Remove the red box
    playerContainer.remove(fallbackCar);

    const realCar = gltf.scene;

    // --- THE HARDCODED FIX ---
    // Your file data shows the car is at X:285, Y:-165. 
    // We strictly inverse this to pull it back to 0,0,0.
    realCar.position.set(-285.5, 166, 3); 
    
    // Scale it down/up to fit
    realCar.scale.set(0.04, 0.04, 0.04); 
    
    realCar.rotation.y = Math.PI; // Spin 180 degrees to face forward

    playerContainer.add(realCar);

}, undefined, function (error) {
    console.error("ERROR LOADING CAR:", error);
});

// --- ROAD ---
const roadGeo = new THREE.PlaneGeometry(14, 1000);
const roadMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.z = -200;
scene.add(road);

// --- INPUT ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && lane > 0) lane--;
    if (e.key === 'ArrowRight' && lane < 2) lane++;
});

// --- LOOP ---
function animate() {
    requestAnimationFrame(animate);

    if (gameOver) return;

    // Move Container to Lane
    playerContainer.position.x += (lanes[lane] - playerContainer.position.x) * 0.1;

    // Tilt Effect
    playerContainer.rotation.z = (playerContainer.position.x - lanes[lane]) * 0.05;

    // Move Road Effect
    road.position.z += speed;
    if (road.position.z > 0) road.position.z = -200;

    renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
