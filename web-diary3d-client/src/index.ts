import { CharacterControls } from "./character/character.control";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { io, Socket } from "socket.io-client";
import Stats from "three/examples/jsm/libs/stats.module";
import { createCharacterControls } from "./character/character.factory";

const isMobile =
  navigator.userAgent.match(/Android/i) ||
  navigator.userAgent.match(/webOS/i) ||
  navigator.userAgent.match(/iPhone/i) ||
  navigator.userAgent.match(/iPad/i) ||
  navigator.userAgent.match(/iPod/i) ||
  navigator.userAgent.match(/BlackBerry/i) ||
  navigator.userAgent.match(/Windows Phone/i);

let allCharacterControls: CharacterControls[] = [];
const prerenderedOtherCharacterControls: CharacterControls[] = [];
const othersMouseClickPoints = new Map<string, THREE.Vector3>();

const maxOtherUserCount = 3;

// SOCKET
export let socket: Socket;
function initSocketListen() {
  socket = io(process.env.SOCKET_URI, {
    transports: ["websocket"],
    closeOnBeforeunload: false,
  });

  socket.on("connect", () => {
    console.log("connected");
  });

  socket.on(
    "others-pos",
    (characterPositions: { [key: string]: THREE.Vector3 }) => {
      console.log("others-pos", characterPositions);
      for (let clientId in characterPositions) {
        allocateCharacter(clientId, characterPositions[clientId]);
      }
    }
  );

  socket.on("user-join", (clientId) => {
    allocateCharacter(clientId);
  });

  socket.on("user-leave", (clientId) => {
    freeCharacter(clientId);
  });

  socket.on("mouse-click-point", (data) => {
    const { clientId, mouseClickPoint } = data;
    const { x, y, z } = mouseClickPoint;
    const position = new THREE.Vector3(x, y, z);

    othersMouseClickPoints.set(clientId, position);
  });

  socket.on("chat", (data) => {
    const { clientId, message } = data;
    const controls = allCharacterControls.find(
      (controls) => controls.id == clientId
    );
    controls.showChatbubble(message, scene);
  });

  setInterval(() => {
    socket.emit("sync-pos", allCharacterControls[0].model.position);
  }, 1000);

  initListenKeyboardInput();
}

function initListenKeyboardInput() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "전송할 메세지를 입력해 주세요";
  input.style.position = "absolute";
  input.style.top = "40%";
  input.style.left = "50%";
  input.style.transform = "translate(-50%, -50%)";
  input.style.backgroundColor = "transparent";
  input.style.border = "none";
  input.style.outline = "none";
  input.style.textAlign = "center";
  input.style.fontSize = isMobile ? "66px" : "33px";
  input.style.visibility = "hidden";
  input.style.width = "100vw";
  document.body.appendChild(input);

  input.addEventListener("blur", function () {
    input.style.visibility = "hidden";
  });

  document.addEventListener("keypress", (event) => {
    console.log(event.key);
    if (event.key === "Enter") {
      if (document.activeElement === input) {
        allCharacterControls[0].showChatbubble(input.value, scene);
        socket.emit("chat", input.value);

        input.value = "";
        input.blur();
      } else {
        input.style.visibility = "visible";
        input.focus();
      }
    }
  });

  if (isMobile) {
    const messageBtn = document.createElement("button");
    messageBtn.style.position = "absolute";
    messageBtn.style.bottom = "20px";
    messageBtn.style.right = "20px";
    messageBtn.style.fontSize = "64px";
    messageBtn.style.padding = "10px 20px";
    messageBtn.style.backgroundColor = "transparent";
    messageBtn.style.border = "none";
    messageBtn.style.outline = "none";
    messageBtn.style.boxShadow = "none";
    messageBtn.innerText = "메세지 전송";
    document.body.appendChild(messageBtn);

    messageBtn.addEventListener("touchstart", (event) => {
      console.log("start");
      event.stopPropagation();

      input.style.visibility = "visible";
      input.focus();
    }, { capture: true });
  }
}

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
camera.position.y = 4;
camera.position.z = 3;
camera.position.x = -1;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
renderer.setSize(window.innerWidth, window.innerHeight);
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
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.x = 50;
  dirLight.position.y = 105;
  dirLight.position.z = 95;
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
  // scene.add(new THREE.CameraHelper(dirLight.shadow.camera));
}

light();

// FLOOR
function generateFloor() {
  // TEXTURES
  const textureLoader = new THREE.TextureLoader();
  const sketchbook = textureLoader.load("./textures/sketchbook.jpeg");

  const WIDTH = 60;
  const LENGTH = 60;

  const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH);
  const material = new THREE.MeshStandardMaterial({
    map: sketchbook,
    normalMap: sketchbook,
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

// CHARACTERS
async function generateCharacters() {
  const myCharacterControl = await createCharacterControls(
    "models/Character.glb",
    orbitControls,
    camera,
    scene,
    "me"
  );

  allCharacterControls.push(myCharacterControl);

  // FOR PRERENDER OTHER PLAYERS MODELS
  for (let i = 0; i < maxOtherUserCount; ++i) {
    const controls = await createCharacterControls(
      "models/Character.glb",
      orbitControls,
      camera,
      scene,
      null
    );

    controls.model.scale.y *= -1;
    prerenderedOtherCharacterControls.push(controls);
  }
}

function allocateCharacter(clientId: string, position?: THREE.Vector3) {
  if (
    allCharacterControls.length >=
    maxOtherUserCount + 1 /* 나의 케릭터 수 1 */
  ) {
    console.error("정원 초과");
    return;
  }
  const controls = prerenderedOtherCharacterControls.shift();
  controls.id = clientId;
  controls.model.scale.y *= -1;
  if (position) {
    controls.model.position.x = position.x;
    controls.model.position.z = position.z;
  }
  allCharacterControls.push(controls);
}

function freeCharacter(clientId: string) {
  const index = allCharacterControls.findIndex(
    (controls) => controls.id == clientId
  );
  if (index !== -1) {
    const controls = allCharacterControls[index];
    allCharacterControls.splice(index, 1);
    othersMouseClickPoints.delete(clientId);
    controls.model.position.x = 0;
    controls.model.position.z = 0;
    controls.model.scale.y *= -1;
    prerenderedOtherCharacterControls.push(controls);
  }
}

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

// RESIZE HANDLER
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

function updateMouseClickPoint() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(scene.getObjectByName("floor"));

  if (intersects.length > 0) {
    mouseClickPoint = intersects[0].point;
  }
}

const stats = Stats();
document.body.appendChild(stats.dom);

const clock = new THREE.Clock();

// ANIMATE
function animate() {
  let mixerUpdateDelta = clock.getDelta();
  if (isMouseDown) {
    updateMouseClickPoint();
    socket.emit("mouse-click-point", mouseClickPoint);
  }
  for (let i = 0; i < allCharacterControls.length; ++i) {
    const controls = allCharacterControls[i];
    if (controls.id === "me") {
      controls.update(mixerUpdateDelta, mouseClickPoint);
    } else {
      controls.update(
        mixerUpdateDelta,
        othersMouseClickPoints.get(controls.id)
      );
    }
  }
  orbitControls.update();
  stats.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);

async function load() {
  await generateCharacters();
  initSocketListen();
}

load().then(animate);
