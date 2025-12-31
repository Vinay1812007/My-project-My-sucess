import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- VARIABLES ---
let scene, camera, renderer;
let playerContainer, fallbackBox;
let obstacles = [];
let speed = 0.5;
let score = 0;
let gameOver = false;
let currentLane = 1; // 0=Left, 1=Center, 2=Right
const LANES = [-3, 0, 3];

function init() {
    // 1. SETUP
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, -5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 2. LIGHTS
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // 3. ROAD
    const roadGeo = new THREE.PlaneGeometry(20, 2000);
    const roadMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -500;
    scene.add(road);

    // 4. PLAYER CONTAINER & FALLBACK BOX
    playerContainer = new THREE.Group();
    scene.add(playerContainer);

    // Create a RED BOX so you can play even if the car fails
    const boxGeo = new THREE.BoxGeometry(1.5, 1, 3);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    fallbackBox = new THREE.Mesh(boxGeo, boxMat);
    fallbackBox.position.y = 0.5;
    playerContainer.add(fallbackBox);

    // 5. ATTEMPT TO LOAD CAR
    loadCarModel('assets/bmw.glb'); // Try folder first

    // 6. EVENTS
    document.addEventListener('keydown', handleInput);
    document.getElementById('replay-btn').addEventListener('click', resetGame);
    window.addEventListener('resize', onResize);

    animate();
}

// --- SMART LOADER ---
function loadCarModel(path) {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
        console.log("Car loaded from:", path);
        
        // Success! Remove red box
        playerContainer.remove(fallbackBox);
        
        const car = gltf.scene;
        
        // AUTO-CENTER & SCALE
        const box = new THREE.Box3().setFromObject(car);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        car.position.set(-center.x, -center.y, -center.z); // Center it
        
        // Scale to 3 units wide
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.0 / maxDim;
        car.scale.set(scale, scale, scale);

        // Face forward
        playerContainer.rotation.y = Math.PI; 
        playerContainer.position.y = 0.5;

        playerContainer.add(car);

    }, undefined, (error) => {
        // If 'assets/bmw.glb' fails, try just 'bmw.glb'
        if(path === 'assets/bmw.glb') {
            console.log("Retrying in root folder...");
            loadCarModel('bmw.glb');
        } else {
            console.error("Car failed to load. Using Red Box.");
        }
    });
}

function handleInput(e) {
    if(gameOver) return;
    if(e.key === 'ArrowLeft' && currentLane > 0) currentLane--;
    if(e.key === 'ArrowRight' && currentLane < 2) currentLane++;
}

function resetGame() {
    gameOver = false;
    score = 0;
    speed = 0.5;
    document.getElementById('score').innerText = '0';
    document.getElementById('game-over').style.display = 'none';
    
    // Clear obstacles
    obstacles.forEach(obs => scene.remove(obs));
    obstacles = [];
    
    // Reset position
    currentLane = 1;
    playerContainer.position.x = 0;
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x004444 });
    const obs = new THREE.Mesh(geo, mat);
    obs.position.set(LANES[lane], 0.75, -100);
    scene.add(obs);
    obstacles.push(obs);
}

function animate() {
    requestAnimationFrame(animate);
    if (gameOver) return;

    // Move Player
    const targetX = LANES[currentLane];
    playerContainer.position.x += (targetX - playerContainer.position.x) * 0.1;
    playerContainer.rotation.z = (playerContainer.position.x - targetX) * 0.1; // Tilt

    // Spawn & Move Obstacles
    if (Math.random() < 0.03) spawnObstacle();

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.position.z += speed;

        // Collision
        if (obs.position.z > -2 && obs.position.z < 2) {
            if (Math.abs(obs.position.x - playerContainer.position.x) < 1.2) {
                gameOver = true;
                document.getElementById('final-score').innerText = score;
                document.getElementById('game-over').style.display = 'block';
            }
        }

        if (obs.position.z > 10) {
            scene.remove(obs);
            obstacles.splice(i, 1);
            score++;
            document.getElementById('score').innerText = score;
            speed += 0.0005;
        }
    }
    
    renderer.render(scene, camera);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
