import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer;
let car;
let speed = 0;
let keys = {};

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 3, 6);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Load BMW
    const loader = new GLTFLoader();
    loader.load(
        "assets/cars/bmw.glb",
        (gltf) => {
            car = gltf.scene;
            car.scale.set(1.2, 1.2, 1.2);
            car.position.set(0, 0, 0);
            scene.add(car);
        },
        undefined,
        (error) => {
            console.error("GLB Load Error:", error);
        }
    );

    // Controls
    window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

    window.addEventListener("resize", onResize);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (car) {
        // Forward / Brake
        if (keys["w"]) speed += 0.02;
        if (keys["s"]) speed -= 0.02;

        // Friction
        speed *= 0.98;

        // Steering
        if (keys["a"]) car.rotation.y += 0.03;
        if (keys["d"]) car.rotation.y -= 0.03;

        // Move forward
        car.translateZ(-speed);

        // Camera follow
        const camOffset = new THREE.Vector3(0, 3, 6);
        camOffset.applyAxisAngle(new THREE.Vector3(0,1,0), car.rotation.y);
        camera.position.copy(car.position).add(camOffset);
        camera.lookAt(car.position);
    }

    renderer.render(scene, camera);
}
