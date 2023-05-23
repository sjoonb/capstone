import * as THREE from "three";
import { TextGeometry, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export class Character {
  public id: string | null;
  public model: THREE.Group;
  private mixer: THREE.AnimationMixer;
  private animationsMap: Map<string, THREE.AnimationAction> = new Map(); // Run, Idle
  private orbitControl: OrbitControls;
  private camera: THREE.Camera;

  // chatbubble
  private chatbubble: THREE.Mesh<TextGeometry, any> | null;
  private chatBubbleSize: THREE.Vector3;
  private chatbubbleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  private timer: any;
  private font: THREE.Font;

  // state
  private currentAction: string;

  // temporary data
  private rotateAngle = new THREE.Vector3(0, 1, 0);
  private rotateQuarternion: THREE.Quaternion = new THREE.Quaternion();
  private cameraTarget = new THREE.Vector3();

  // constants
  private fadeDuration: number = 0.2;
  private velocity = 5;

  constructor(
    id: string | null,
    orbitControl: OrbitControls,
    camera: THREE.Camera,
    font: THREE.Font,
    gltf: GLTF,
    currentAction: string
  ) {
    this.id = id;
    this.model = gltf.scene;
    this.model.traverse(function (object: any) {
      if (object.isMesh) {
        object.castShadow = true;
        object.renderOrder = 10;
      }
    });
    const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
    this.mixer = new THREE.AnimationMixer(this.model);
    gltfAnimations
      .filter((a) => a.name != "TPose")
      .forEach((a: THREE.AnimationClip) => {
        this.animationsMap.set(a.name, this.mixer.clipAction(a));
      });
    this.currentAction = currentAction;
    this.animationsMap.forEach((value, key) => {
      if (key == currentAction) {
        value.play();
      }
    });
    this.orbitControl = orbitControl;
    this.camera = camera;
    this.font = font;
    if (id === "me") {
      this.updateCameraTarget(0, 0);
    }
  }

  public update(delta: number, position: THREE.Vector3 | null) {
    const shouldMoveCharacter = position
      ? this.shouldMoveCharacterTo(position)
      : false;

    let play = "";
    if (shouldMoveCharacter) {
      play = "Run";
    } else {
      play = "Idle";
    }

    if (this.currentAction != play) {
      const toPlay = this.animationsMap.get(play);
      const current = this.animationsMap.get(this.currentAction);

      current.fadeOut(this.fadeDuration);
      toPlay.reset().fadeIn(this.fadeDuration).play();

      this.currentAction = play;
    }

    this.mixer.update(delta);

    if (this.currentAction == "Run") {
      //   calculate towards camera direction
      const angleYCameraDirection = Math.atan2(
        this.model.position.x - position.x,
        this.model.position.z - position.z
      );

      // calculate direction
      const walkDirection = new THREE.Vector3();
      walkDirection.subVectors(position, this.model.position);
      walkDirection.normalize();

      // rotate model
      this.rotateQuarternion.setFromAxisAngle(
        this.rotateAngle,
        angleYCameraDirection
      );
      this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.4);

      // move model & camera
      const moveX = walkDirection.x * this.velocity * delta;
      const moveZ = walkDirection.z * this.velocity * delta;
      this.model.position.x += moveX;
      this.model.position.z += moveZ;

      if (this.id === "me") {
        this.updateCameraTarget(moveX, moveZ);
      }
    }

    if (this.chatbubble) {
      this.updateChatbubblePosition();
    }
  }

  public showChatbubble(text: string, scene: THREE.Scene) {
    if (this.chatbubble) {
      scene.remove(this.chatbubble);
      this.chatbubble = null;
      clearTimeout(this.timer);
    }

    this.chatbubble = this.createChatBubble(scene, text);
    const boundingBoxHelper = new THREE.Box3().setFromObject(this.chatbubble);
    this.chatBubbleSize = boundingBoxHelper.getSize(new THREE.Vector3());

    this.timer = setTimeout(() => {
      scene.remove(this.chatbubble);
      this.chatbubble = null;
    }, 3000);
  }

  public teleportTo(delta: number, position: THREE.Vector3) {
    while (this.shouldMoveCharacterTo(position)) {
      this.update(delta, position);
    }
  }

  private shouldMoveCharacterTo(position: THREE.Vector3): boolean {
    const threshold = 0.1;
    const xDiff = Math.abs(this.model.position.x - position.x);
    const zDiff = Math.abs(this.model.position.z - position.z);
    return xDiff >= threshold || zDiff >= threshold;
  }

  private updateCameraTarget(moveX: number, moveZ: number) {
    // move camera
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;

    // update camera target
    this.cameraTarget.x = this.model.position.x;
    this.cameraTarget.y = this.model.position.y + 1;
    this.cameraTarget.z = this.model.position.z;
    this.orbitControl.target = this.cameraTarget;
  }

  private createChatBubble(scene: THREE.Scene, text: string) {
    const geometry = new THREE.TextGeometry(text, {
      font: this.font,
      size: 0.35,
      height: 0,
    });

    const bubble = new THREE.Mesh(geometry, this.chatbubbleMaterial);
    bubble.position.set(0, 1.7, 0);

    scene.add(bubble);

    return bubble;
  }

  private updateChatbubblePosition() {
    this.chatbubble.position.x =
      this.model.position.x - this.chatBubbleSize.x / 2;
    this.chatbubble.position.z =
      this.model.position.z + this.chatBubbleSize.z / 2;
  }
}
