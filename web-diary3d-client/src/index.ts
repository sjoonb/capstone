import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SceneController } from "./controllers/SceneController";
import { GameController } from "./controllers/GameController";
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
import { SpaceController } from "./controllers/SpaceController";

class Main {
  private gameController: GameController;

  constructor({ maxUserCount }: { maxUserCount: number }) {
    this.init(maxUserCount);
  }

  private async init(maxUserCount: number) {
    // Initialize the scene
    const sceneController = new SceneController({ isMobile: isMobile });

    const networkController = new NetworkController({
      endPointUrl: "http://192.168.35.163:3333",
    });

    const canvasState = await networkController.fetchCanvasState();

    // Load scene related files
    await sceneController.loadResources({
      sketchbookUrl: "./textures/sketchbook.jpeg",
      fontUrl: "../resources/Do Hyeon_Regular.json",
      modelUrl: "models/Character.glb",
      canvasState: canvasState,
      maxUserCount: maxUserCount,
    });

    sceneController.init();

    const orbitControls = this.initOrbitControls(sceneController);

    const mouseInputController = isMobile
      ? new MobileMouseInputController()
      : new DesktopMouseInputController();

    const messageController = isMobile
      ? new MobileMessageController()
      : new MessageController();

    const spaceController = new SpaceController();

    // Initialize game controller
    this.gameController = new GameController({
      orbitControls: orbitControls,
      sceneController: sceneController,
      mouseInputController: mouseInputController,
      messageController: messageController,
      networkController: networkController,
      spaceController: spaceController,
      maxUserCount: maxUserCount,
    });

    this.gameController.connectToServer();
    this.gameController.startListenOnMessageSent();
    this.gameController.startListenOnSpaceButtonClick();

    // Start the game loop
    this.gameLoop();
  }

  private initOrbitControls(sceneController: SceneController): OrbitControls {
    const controls = new OrbitControls(
      sceneController.camera,
      sceneController.renderer.domElement
    );
    controls.enableDamping = true;
    controls.minDistance = 5;
    controls.maxDistance = 15;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.update();
    return controls;
  }

  private gameLoop() {
    // Update all controllers
    this.gameController.update();

    // Request the next frame
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the application
new Main({ maxUserCount: 4 });
