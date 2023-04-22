import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { SampleImage } from "../sampleImages";
export class SceneController {
  private sketchbookTexture: THREE.Texture;
  private raycaster = new THREE.Raycaster();
  private loadingBar: HTMLElement = document.getElementById("progress-bar");
  private _scene: THREE.Scene;
  private _camera: THREE.PerspectiveCamera;
  private _renderer: THREE.WebGLRenderer;
  private isMobile: boolean;
  private floor: THREE.Mesh;
  private _font: THREE.Font;
  private _models: GLTF[];
  private _sampleImages: SampleImage[];
  private _sampleImageTextures: THREE.Texture[];

  get camera(): THREE.PerspectiveCamera {
    return this._camera;
  }

  get scene(): THREE.Scene {
    return this._scene;
  }
  get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  get font(): THREE.Font {
    return this._font;
  }

  get models(): GLTF[] {
    return this._models;
  }

  constructor({ isMobile }: { isMobile: boolean }) {
    this.isMobile = isMobile;
  }

  public async loadResources({
    sketchbookUrl,
    fontUrl,
    modelUrl,
    sampleImages,
    maxUserCount,
  }: {
    sketchbookUrl: string;
    fontUrl: string;
    modelUrl: string;
    sampleImages: SampleImage[];
    maxUserCount: number;
  }) {
    this._sampleImages = sampleImages;

    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const gltfLoader = new GLTFLoader(loadingManager);
    const fontLoader = new THREE.FontLoader(loadingManager);

    loadingManager.onLoad = () => {
      this.removeSplashView();
    };

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.setProgress(itemsLoaded / itemsTotal);
    };

    loadingManager.onError = function (url) {
      console.error("There was an error loading " + url);
    };

    try {
      let promises: Promise<any>[] = [];

      promises.push(textureLoader.loadAsync(sketchbookUrl));
      promises.push(fontLoader.loadAsync(fontUrl));

      for (let i = 0; i < maxUserCount; ++i) {
        promises.push(gltfLoader.loadAsync(modelUrl));
      }

      for (let i = 0; i < sampleImages.length; ++i) {
        promises.push(textureLoader.loadAsync(sampleImages[i].url));
      }

      const results = await Promise.all(promises);

      this.sketchbookTexture = results[0];
      this._font = results[1];
      this._models = results.slice(2, 2 + maxUserCount);
      this._sampleImageTextures = results.slice(2 + maxUserCount);

      console.log("All resources loaded!");
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  public init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.addLight();
    this.addFloor();
    this.addSampleImages();
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener("resize", () => this.onWindowResize());
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }
  public raycastMouseClickPoint(mouse: THREE.Vector2): THREE.Vector3 | null {
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObject(
      this.scene.getObjectByName("floor")
    );

    if (intersects.length > 0) {
      return intersects[0].point;
    }

    return null;
  }

  private initScene() {
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xa8def0);
  }

  private initCamera() {
    this._camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this._camera.position.y = 4;
    this._camera.position.z = 3;
    this._camera.position.x = -1;
  }

  private initRenderer() {
    this._renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile });
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.shadowMap.enabled = true;
  }

  private addLight() {
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.75));

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
    this._scene.add(dirLight);
  }

  private addFloor() {
    const WIDTH = 60;
    const LENGTH = 60;

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH);
    const material = new THREE.MeshStandardMaterial({
      map: this.sketchbookTexture,
      normalMap: this.sketchbookTexture,
    });
    this.wrapAndRepeatTexture(material.map);

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.receiveShadow = true;
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.name = "floor";
    const texture = material.map;
    const image = texture.image;
    console.log(image);

    this._scene.add(this.floor);
  }

  private wrapAndRepeatTexture(map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.x = map.repeat.y = 10;
  }

  private async addSampleImages() {
    for (let i = 0; i < this._sampleImageTextures.length; ++i) {
      const sampleImage = this._sampleImages[i];
      const texture = this._sampleImageTextures[i];
      const img = texture.image;
      const geometry = new THREE.PlaneGeometry(
        img.width / 200,
        img.height / 200
      );
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.3,
        transparent: true,
      });
      const image = new THREE.Mesh(geometry, material);
      image.rotation.x = -Math.PI / 2;
      image.position.y += 0.001;
      const boundingBoxHelper = new THREE.Box3().setFromObject(image);
      const size = boundingBoxHelper.getSize(new THREE.Vector3());
      image.receiveShadow = true;
      this.scene.add(image);
      this.renderer.render(this.scene, this.camera);
      image.position.x = sampleImage.x / 200 - 30 + size.x / 2;
      image.position.z = sampleImage.z / 200 - 30 + size.z / 2;
    }
  }

  private onWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private removeSplashView() {
    const element = document.getElementById("splash-view");
    element.classList.add("fadeOut");
    setTimeout(() => {
      element.remove();
    }, 1000);
  }

  private setProgress(value: number) {
    value = Math.min(1, Math.max(0, value));
    this.loadingBar.style.clipPath = `polygon(0 0, ${value * 100}% 0, ${
      value * 100
    }% 100%, 0% 100%)`;
  }
}
