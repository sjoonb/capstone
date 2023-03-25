import { CharacterControls } from "./characterControls";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { io, Socket } from "socket.io-client";
import Stats from "three/examples/jsm/libs/stats.module";
import { checkIsMobile } from "./utils";

const isMobile = checkIsMobile();

const stats = Stats();
document.body.appendChild(stats.dom);

// SOCKET

// export const socket: Socket = io("http://127.0.0.1:80", {
//   transports: ["websocket"],
//   closeOnBeforeunload: false,
// });

// socket.on("connect", () => {
//   console.log("connected");
// });

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
renderer.setSize(window.innerWidth, window.innerHeight);
console.log(window.devicePixelRatio);
renderer.setPixelRatio(window.devicePixelRatio / (isMobile ? 2 : 1));
renderer.shadowMap.enabled = true;

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.enableRotate = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

// LIGHTS
function light() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-60, 100, -10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  scene.add(dirLight);
}

light();

// FLOOR
function generateFloor() {
  // TEXTURES
  const textureLoader = new THREE.TextureLoader();
  const sandBaseColor = textureLoader.load("./textures/sketchbook.jpeg");

  const WIDTH = 80;
  const LENGTH = 80;

  const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
  const material = new THREE.MeshBasicMaterial({
    map: sandBaseColor,
  });
  wrapAndRepeatTexture(material.map);

  const floor = new THREE.Mesh(geometry, material);
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  floor.name = "floor";
  scene.add(floor);
}

function wrapAndRepeatTexture(map: THREE.Texture) {
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.x = map.repeat.y = 10;
}

generateFloor();

// MODEL WITH ANIMATIONS
let characterControls: CharacterControls;
new GLTFLoader().load("models/Character.glb", function (gltf) {
  const model = gltf.scene;
  model.traverse(function (object: any) {
    if (object.isMesh) object.castShadow = true;
  });
  scene.add(model);

  const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
  const mixer = new THREE.AnimationMixer(model);
  const animationsMap: Map<string, THREE.AnimationAction> = new Map();
  gltfAnimations
    .filter((a) => a.name != "TPose")
    .forEach((a: THREE.AnimationClip) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });

  characterControls = new CharacterControls(
    model,
    mixer,
    animationsMap,
    orbitControls,
    camera,
    "Idle"
  );
});

// CONTROL MOUSE & MOBILE TOUCH
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseClickPoint: THREE.Vector3 | null = null;
let isMouseDown = false;

if (isMobile) {
  const onTouchStart = (event: any) => {
    isMouseDown = true;
    onTouchMove(event);
  };

  const onTouchEnd = () => {
    isMouseDown = false;
  };

  const onTouchMove = (event: any) => {
    if (isMouseDown) {
      mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  };

  document.addEventListener("touchstart", onTouchStart);
  document.addEventListener("touchend", onTouchEnd);
  document.addEventListener("touchmove", onTouchMove);
} else {
  const onMouseDown = (event: any) => {
    isMouseDown = true;
    onMouseMove(event);
  };

  const onMouseUp = () => {
    isMouseDown = false;
  };

  const onMouseMove = (event: any) => {
    if (isMouseDown) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
  };

  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mousemove", onMouseMove);
}

function updateMouseClickPoint() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(scene.getObjectByName("floor"));

  if (intersects.length > 0) {
    mouseClickPoint = intersects[0].point;
  }
}

const clock = new THREE.Clock();
// ANIMATE
function animate() {
  let mixerUpdateDelta = clock.getDelta();
  if (isMouseDown) {
    updateMouseClickPoint();
    // socket.emit("message", mouseClickPoint);
  }
  if (characterControls) {
    characterControls.update(mixerUpdateDelta, mouseClickPoint);
  }
  orbitControls.update();
  stats.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);
