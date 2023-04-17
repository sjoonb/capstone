import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Character } from "../character/Character";
import { SampleImage } from "../sampleImages";
export class SceneController {
  private sketchbookTexture: THREE.Texture;
  private models: GLTF[];
  private raycaster = new THREE.Raycaster();
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isMobile: boolean;
  private floor: THREE.Mesh;
  private font: THREE.Font;

  constructor({ isMobile }: { isMobile: boolean }) {
    this.isMobile = isMobile;
  }

  public async loadResources({
    sketchbookUrl,
    fontUrl,
    modelUrl,
    maxUserCount,
  }: {
    sketchbookUrl: string;
    fontUrl: string;
    modelUrl: string;
    maxUserCount: number;
  }) {
    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const gltfLoader = new GLTFLoader(loadingManager);
    const fontLoader = new THREE.FontLoader(loadingManager);

    loadingManager.onLoad = function ( ) {
      console.log( 'Loading complete!');
    };
    
    
    loadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    
      console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    
    };
    
    loadingManager.onError = function ( url ) {
    
      console.log( 'There was an error loading ' + url );
    
    };

    try {
      let promises: Promise<any>[] = [];

      promises.push(textureLoader.loadAsync(sketchbookUrl));
      promises.push(fontLoader.loadAsync(fontUrl));

      for (let i = 0; i < maxUserCount; ++i) {
        promises.push(gltfLoader.loadAsync(modelUrl));
      }

      const results = await Promise.all(promises);

      this.sketchbookTexture = results[0];
      this.font = results[1];
      this.models = results.slice(2);

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
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener("resize", () => this.onWindowResize());
  }

  // public async loadFont(url: string) {
  //   this.font = await this.fontLoader.loadAsync(url);
  // }

  // public async loadSampleImages(sampleImages: SampleImage[]) {
  //   for (let i = 0; i < sampleImages.length; ++i) {
  //     const sampleImage = sampleImages[i];
  //     await this.loadSampleImage(sampleImage);
  //   }
  // }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public geRendererDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  // public async addCharacter({
  //   id,
  //   orbitControls,
  // }: {
  //   id: string | null;
  //   orbitControls: OrbitControls;
  // }) {
  //   const gltf = await this.loadGLB("models/Character.glb");
  //   const character = new Character(
  //     id,
  //     orbitControls,
  //     this.camera,
  //     this.font,
  //     gltf,
  //     "Idle"
  //   );
  //   this.scene.add(character.model);

  //   return character;
  // }

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
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa8def0);
  }

  private initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.y = 4;
    this.camera.position.z = 3;
    this.camera.position.x = -1;
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
  }

  private addLight() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));

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
    this.scene.add(dirLight);
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

    this.scene.add(this.floor);
  }

  private wrapAndRepeatTexture(map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.x = map.repeat.y = 10;
  }

  // private async loadGLB(url: string): Promise<GLTF> {
  // return new Promise((resolve, reject) => {
  //   this.gltfLoader.load(
  //     url,
  //     (gltf: GLTF) => {
  //       resolve(gltf);
  //     },
  //     undefined,
  //     (error) => {
  //       reject(error);
  //     }
  //   );
  // });
  // }

  private async loadSampleImage(sampleImage: SampleImage) {
    // const texture = await this.textureLoader.loadAsync(sampleImage.url);
    // const img = texture.image;
    // const geometry = new THREE.PlaneGeometry(img.width / 200, img.height / 200);
    // const material = new THREE.MeshStandardMaterial({
    //   map: texture,
    //   roughness: 0.3,
    //   metalness: 0.3,
    //   transparent: true,
    // });
    // const image = new THREE.Mesh(geometry, material);
    // image.rotation.x = -Math.PI / 2;
    // image.position.y += 0.001;
    // const boundingBoxHelper = new THREE.Box3().setFromObject(image);
    // const size = boundingBoxHelper.getSize(new THREE.Vector3());
    // image.receiveShadow = true;
    // this.scene.add(image);
    // this.renderer.render(this.scene, this.camera);
    // image.position.x = sampleImage.x / 200 - 30 + size.x / 2;
    // image.position.z = sampleImage.z / 200 - 30 + size.z / 2;
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
