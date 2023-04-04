import { Font } from "three";
import THREE = require("three");

let fontLoader = new THREE.FontLoader();
let materialCache: THREE.MeshBasicMaterial = null;
let font: THREE.Font;

export async function loadFont() {
  font = await fontLoader.loadAsync("../resources/Gamja Flower_Regular.json");
}

export function createChatBubble(scene: THREE.Scene, text: string) {
  if (font == null) {
    loadFont();
  }

  const geometry = new THREE.TextGeometry(text, {
    font: font,
    size: 0.35,
    height: 0,
  });

  const material = getCachedMaterial();

  const bubble = new THREE.Mesh(geometry, material);
  bubble.position.set(0, 1.7, 0);

  scene.add(bubble);

  return bubble;
}

function getCachedMaterial() {
  if (!materialCache) {
    materialCache = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
  }
  return materialCache;
}
