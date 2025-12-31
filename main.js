// --- Load Your BMW (Fixed for Center & Size) ---
const loader = new GLTFLoader();
// Try to load from root first, just in case path is wrong
loader.load('assets/bmw.glb', function (gltf) {
    playerCar = gltf.scene;

    // 1. Calculate the real center of the car
    const box = new THREE.Box3().setFromObject(playerCar);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 2. Fix the Position: Move the car so its center is at (0,0,0)
    playerCar.position.x += (playerCar.position.x - center.x);
    playerCar.position.y += (playerCar.position.y - center.y);
    playerCar.position.z += (playerCar.position.z - center.z);

    // 3. Fix the Size: Scale it to be roughly 2 units wide
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim; 
    playerCar.scale.set(scale, scale, scale);

    // 4. Final adjustments
    playerCar.rotation.y = Math.PI; // Face forward
    playerCar.position.y = 0.5;     // Lift slightly above road
    
    scene.add(playerCar);
    
    // Start game loop
    animate();
}, undefined, function (error) {
    console.error("Error loading car:", error);
    // Fallback: If car fails to load, add a Green Box so game still runs
    const geometry = new THREE.BoxGeometry(1, 1, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    playerCar = new THREE.Mesh(geometry, material);
    scene.add(playerCar);
    animate();
});
