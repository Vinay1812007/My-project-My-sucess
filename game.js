// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0c0); // Foggy sky color
scene.fog = new THREE.Fog(0xa0a0c0, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Lighting
const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);

// 3. The Player (A simple Cube for now)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.5; // Sit on top of floor
scene.add(player);

// 4. The Floor (3 Lanes)
const floorGeometry = new THREE.PlaneGeometry(1000, 100);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 }); // Grass Green
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 5. Movement Logic
let currentLane = 0; // -1 (Left), 0 (Middle), 1 (Right)
const laneWidth = 2;

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && currentLane > -1) {
        currentLane--;
    } else if (event.key === 'ArrowRight' && currentLane < 1) {
        currentLane++;
    }
});

// 6. Game Loop
function animate() {
    requestAnimationFrame(animate);

    // Smoothly move player to target lane
    player.position.x += (currentLane * laneWidth - player.position.x) * 0.1;

    // Simulate forward movement (by moving floor backwards conceptually)
    // In a real game, you create obstacles that move towards Z positive
    
    renderer.render(scene, camera);
}

animate();
