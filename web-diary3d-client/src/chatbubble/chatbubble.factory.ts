import { Font } from "three";
import THREE = require("three");

let fontLoader = new THREE.FontLoader();
let fontCache: Font = null;
let materialCache: THREE.MeshBasicMaterial = null;

export async function createChatBubble(
  scene: THREE.Scene,
  text: string,
) {
  const font = await loadCachedFont("../resources/Gamja Flower_Regular.json");
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

async function loadCachedFont(fontPath: string) {
  if (!fontCache) {
    fontCache = await loadFont(fontPath);
  }
  return fontCache;
}

async function loadFont(url: string): Promise<Font> {
  return new Promise((resolve, reject) => {
    fontLoader.load(
      url,
      (font: any) => {
        resolve(font);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}


function getCachedMaterial() {
  if (!materialCache) {
    materialCache = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
  }
  return materialCache;
}
