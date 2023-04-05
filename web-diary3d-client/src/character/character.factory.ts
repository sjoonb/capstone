import THREE = require("three");
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { CharacterControls } from "./character.control";

const gltfLoader = new GLTFLoader();

export async function createCharacterControls(
  glbUrl: string,
  orbitControls: OrbitControls,
  camera: THREE.Camera,
  scene: THREE.Scene,
  id: string | null
) {
  const gltf = await loadGLB(glbUrl);
  const model = gltf.scene;

  model.traverse(function (object: any) {
    if (object.isMesh) {
      object.castShadow = true;
      object.renderOrder = 10;
    }
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

  return new CharacterControls(
    id,
    model,
    mixer,
    animationsMap,
    orbitControls,
    camera,
    "Idle"
  );
}

async function loadGLB(url: string): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf: GLTF) => {
        resolve(gltf);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}
