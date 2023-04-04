import * as THREE from "three";
import { TextGeometry, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createChatBubble } from "../chatbubble/chatbubble.factory";

export class CharacterControls {
  id: string | null;
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  animationsMap: Map<string, THREE.AnimationAction> = new Map(); // Run, Idle
  orbitControl: OrbitControls;
  camera: THREE.Camera;

  // chatbubble
  chatbubble: THREE.Mesh<TextGeometry, any> | null;
  chatBubbleSize: THREE.Vector3;
  timer: any;

  // state
  currentAction: string;

  // temporary data
  rotateAngle = new THREE.Vector3(0, 1, 0);
  rotateQuarternion: THREE.Quaternion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();

  // constants
  fadeDuration: number = 0.2;
  velocity = 5;

  constructor(
    id: string | null,
    model: THREE.Group,
    mixer: THREE.AnimationMixer,
    animationsMap: Map<string, THREE.AnimationAction>,
    orbitControl: OrbitControls,
    camera: THREE.Camera,
    currentAction: string
  ) {
    this.id = id;
    this.model = model;
    this.mixer = mixer;
    this.animationsMap = animationsMap;
    this.currentAction = currentAction;
    this.animationsMap.forEach((value, key) => {
      if (key == currentAction) {
        value.play();
      }
    });
    this.orbitControl = orbitControl;
    this.camera = camera;
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

  public async showChatbubble(text: string, scene: THREE.Scene) {
    if (this.chatbubble) {
      scene.remove(this.chatbubble);
      this.chatbubble = null;
      clearTimeout(this.timer);
    }

    this.chatbubble = createChatBubble(scene, text);
    const boundingBoxHelper = new THREE.Box3().setFromObject(this.chatbubble);
    this.chatBubbleSize = boundingBoxHelper.getSize(new THREE.Vector3());
    this.updateChatbubblePosition();

    this.timer = setTimeout(() => {
      scene.remove(this.chatbubble);
      this.chatbubble = null;
    }, 3000);
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

  private updateChatbubblePosition() {
    this.chatbubble.position.x =
      this.model.position.x - this.chatBubbleSize.x / 2;
    this.chatbubble.position.z =
      this.model.position.z + this.chatBubbleSize.z / 2;
  }
}
