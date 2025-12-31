import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- CONFIGURATION ---
const LANE_POSITIONS = [-3, 0, 3]; // Left, Center, Right lanes
const CAR_SPEED_BASE = 0.4;

// --- GLOBALS ---
let scene, camera, renderer;
let playerContainer, playerCar;
let obstacles = [];
let road, roadMarkings = [];
let currentLane = 1;
let targetX = 0;
let score = 0;
let gameOver = false;
let speed = CAR_SPEED_BASE;

function init() {
    // 1. SETUP SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e); // Dark Blue Night Sky
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 40);

    // 2. SETUP CAMERA
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 7); // High and behind
    camera.lookAt(0, 0, -5);

    // 3. RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Turn on shadows
    document.body.appendChild(renderer.domElement);

    // 4. LIGHTING (Graphics Upgrade)
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);

    // 5. ROAD
    createRoad();

    // 6. LOAD CAR (The Fix)
    loadPlayerCar();

    // 7. LISTENERS
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', handleInput);
    
    // Start Loop
    animate();
}

function createRoad() {
    // Main asphalt
    const roadGeo = new THREE.PlaneGeometry(12, 1000);
    const roadMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    // Striped lines
    const lineGeo = new THREE.PlaneGeometry(0.2, 1000);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftLine = new THREE.Mesh(lineGeo, lineMat);
    leftLine.position.set(-1.5, 0.02, 0);
    leftLine.rotation.x = -Math.PI / 2;
    scene.add(leftLine);

    const rightLine = new THREE.Mesh(lineGeo, lineMat);
    rightLine.position.set(1.5, 0.02, 0);
    rightLine.rotation.x = -Math.PI / 2;
    scene.add(rightLine);
}

function loadPlayerCar() {
    const loader = new GLTFLoader();
    
    // We create a "Container" group. We move the container, not the raw model.
    playerContainer = new THREE.Group();
    scene.add(playerContainer);

    // Try loading with 'assets/' prefix, fallback to root if needed
    const path = 'assets/bmw.glb'; 

    loader.load(path, (gltf) => {
        const rawModel = gltf.scene;

        // --- AUTO-CENTERING MAGIC ---
        // 1. Calculate the bounding box of the raw model
        const box = new THREE.Box3().setFromObject(rawModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // 2. Center the model relative to its parent (the container)
        // We shift it by negative its center position
        rawModel.position.x = -center.x;
        rawModel.position.y = -center.y;
        rawModel.position.z = -center.z;

        // 3. Scale it to a reasonable size (e.g., 2 units wide)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 3.5 / maxDim; // Adjust 3.5 to make car bigger/smaller
        rawModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // 4. Rotate if needed (BMW usually faces wrong way)
        playerContainer.rotation.y = Math.PI; 

        // 5. Add corrected model to container
        playerContainer.add(rawModel);
        
        // 6. Lift container slightly above road
        playerContainer.position.y = 0.5;

        // Enable shadows
        rawModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        document.getElementById('loading').style.display = 'none';

    }, undefined, (error) => {
        console.error("Model Error:", error);
        // Fallback Box if model fails
        const geo = new THREE.BoxGeometry(1.5, 1, 3);
        const mat = new THREE.MeshNormalMaterial();
        const box = new THREE.Mesh(geo, mat);
        box.position.y = 0.5;
        playerContainer.add(box);
        document.getElementById('loading').innerText = "Model Failed - Using Box";
    });
}

function handleInput(e) {
    if (gameOver) return;
    if (e.key === 'ArrowLeft' && currentLane > 0) {
        currentLane--;
    } else if (e.key === 'ArrowRight' && currentLane < 2) {
        currentLane++;
    }
}

function spawnObstacle() {
    const laneIndex = Math.floor(Math.random() * 3);
    const laneX = LANE_POSITIONS[laneIndex];

    // Neon Obstacle
    const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xff0055,
        emissive: 0xaa0033,
        emissiveIntensity: 0.5
    });
    const obs = new THREE.Mesh(geo, mat);
    
    obs.position.set(laneX, 0.75, -50);
    obs.castShadow = true;
    
    scene.add(obs);
    obstacles.push(obs);
}

function update() {
    if (gameOver) return;

    // 1. Smooth Lane Switching
    targetX = LANE_POSITIONS[currentLane];
    if (playerContainer) {
        // Interpolate position (smooth slide)
        playerContainer.position.x += (targetX - playerContainer.position.x) * 0.1;
        
        // Tilt car slightly when turning
        playerContainer.rotation.z = (playerContainer.position.x - targetX) * 0.1;
    }

    // 2. Spawn Logic
    if (Math.random() < 0.02) spawnObstacle();

    // 3. Move Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.position.z += speed;

        // Collision detection
        if (playerContainer) {
            // Simple distance check
            const dx = playerContainer.position.x - obs.position.x;
            const dz = playerContainer.position.z - obs.position.z;
            if (Math.abs(dx) < 1.2 && Math.abs(dz) < 1.5) {
                gameOver = true;
                document.getElementById('game-over').style.display = 'block';
            }
        }

        // Cleanup
        if (obs.position.z > 10) {
            scene.remove(obs);
            obstacles.splice(i, 1);
            score += 10;
            document.getElementById('score').innerText = score;
            speed += 0.0005; // Acceleration
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
