// import { NetworkController } from "./controllers/NetworkController";
// import { MessageController } from "./controllers/MessageController";
// import { KeyboardInputController } from "./controllers/KeyboardInputController";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SceneController } from "./controllers/SceneController";
import { GameController } from "./controllers/GameController";
// import { CharacterControls } from "./character/CharacterControls";
import { isMobile } from "./utils";
import {
  DesktopMouseInputController,
  MobileMouseInputController,
} from "./controllers/MouseInputController";
import {
  MessageController,
  MobileMessageController,
} from "./controllers/MessageController";
import { NetworkController } from "./controllers/NetworkController";
import { sampleImages } from "./sampleImages";

class Main {
  private gameController: GameController;
  private orbitControls: OrbitControls;
  private maxUserCount: number;

  constructor({ maxUserCount }: { maxUserCount: number }) {
    this.maxUserCount = maxUserCount;
    this.init();
  }

  private async init() {
    // Initialize the scene
    const sceneController = new SceneController({ isMobile: isMobile });

    // Load scene related files
    // await sceneController.loadFont("../resources/Do Hyeon_Regular.json");
    // await sceneController.loadSampleImages(sampleImages);
    // await sceneController.loadFont("../resources/Do Hyeon_Regular.json");
    await sceneController.loadResources({
      sketchbookUrl: "./textures/sketchbook.jpeg",
      fontUrl: "../resources/Do Hyeon_Regular.json",
      modelUrl: "models/Character.glb",
      maxUserCount: this.maxUserCount,
    });

    sceneController.init();

    this.initOrbitControls(
      sceneController.getCamera(),
      sceneController.geRendererDomElement()
    );

    const mouseInputController = isMobile
      ? new MobileMouseInputController()
      : new DesktopMouseInputController();

    const messageController = isMobile
      ? new MobileMessageController()
      : new MessageController();

    const networkController = new NetworkController({
      websocketUrl: "https://share-diaray-server-juzsiiiivq-an.a.run.app/",
    });

    // Initialize game controller
    this.gameController = new GameController({
      sceneController: sceneController,
      mouseInputController: mouseInputController,
      messageController: messageController,
      networkController: networkController,
    });

    // await this.gameController.initCharacters({
    //   maxCharacterCount: this.maxUserCount,
    //   orbitControls: this.orbitControls,
    // });

    // this.gameController.connectToServer();
    // this.gameController.startListenOnMessageSent();

    // Start the game loop
    this.gameLoop();
  }

  private initOrbitControls(
    camera: THREE.Camera,
    domElement: HTMLCanvasElement
  ) {
    this.orbitControls = new OrbitControls(camera, domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.minDistance = 5;
    this.orbitControls.maxDistance = 15;
    this.orbitControls.enablePan = false;
    this.orbitControls.enableRotate = false;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.orbitControls.update();
  }

  private gameLoop() {
    // Update all controllers
    this.gameController.update();
    this.orbitControls.update();

    // Request the next frame
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the application
new Main({ maxUserCount: 4 });
