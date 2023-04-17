import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SceneController } from "./SceneController";
import * as THREE from "three";
import { MouseInputController } from "./MouseInputController";
import { Character } from "../character/Character";
import { MessageController as MessageController } from "./MessageController";
import { NetworkController } from "./NetworkController";

export class GameController {
  private sceneController: SceneController;
  private mouseInputController: MouseInputController;
  private messageController: MessageController;
  private networkController: NetworkController;
  private myCharacter: Character;
  private preservedOtherCharacters: Character[] = [];
  private allCharacters: Character[] = [];
  private clock = new THREE.Clock();
  private mouseClickPoint: THREE.Vector3 | null = null;
  private othersMouseClickPoint: Map<string, THREE.Vector3> = new Map<
    string,
    THREE.Vector3
  >();
  private isServerFull: boolean;

  constructor({
    sceneController,
    mouseInputController,
    messageController,
    networkController,
  }: {
    sceneController: SceneController;
    mouseInputController: MouseInputController;
    messageController: MessageController;
    networkController: NetworkController;
  }) {
    this.sceneController = sceneController;
    this.mouseInputController = mouseInputController;
    this.messageController = messageController;
    this.networkController = networkController;
  }

  // public async initCharacters({
  //   maxCharacterCount,
  //   orbitControls,
  // }: {
  //   maxCharacterCount: number;
  //   orbitControls: OrbitControls;
  // }) {
  //   this.myCharacter = await this.sceneController.addCharacter({
  //     id: "me",
  //     orbitControls: orbitControls,
  //   });
  //   this.sceneController.render();
  //   this.allCharacters.push(this.myCharacter);

  //   for (let i = 0; i < maxCharacterCount - 1; ++i) {
  //     const otherCharacter = await this.sceneController.addCharacter({
  //       id: null,
  //       orbitControls: orbitControls,
  //     });
  //     otherCharacter.model.scale.y *= -1;
  //     this.preservedOtherCharacters.push(otherCharacter);
  //     this.sceneController.render();
  //     //   setProgress(
  //     //     ((1 + 2) / maxOtherUserCount + 1) * characterRenderProgressRatio +
  //     //       textureLoadingProgressRatio
  //     //   );
  //   }
  // }

  public connectToServer() {
    this.networkController.initSocketService({
      onConnect: () => {
        this.networkController.emitMyChracterInitialPosition(
          this.myCharacter.model.position
        );

        setInterval(() => {
          this.networkController.emitSyncPos(this.myCharacter.model.position);
        }, 1000);
      },
      onFull: () => {
        alert(
          "정원이 초과되어 서버에 접속할 수 없습니다. 오프라인 모드로 전환됩니다."
        );
        this.isServerFull = true;
        this.networkController.disconnectSocket();
      },
      onDisconnect: () => {
        this.freeAllOthersCharacter();
        if (!this.isServerFull) {
          alert("연결이 해제되었습니다. 새로고침 하여 다시 시도해주세요.");
        }
        this.networkController.disconnectSocket();
      },
      onOthersInitialPos: (characterPositions) => {
        for (let clientId in characterPositions) {
          this.allocateCharacter(clientId, characterPositions[clientId]);
        }
      },
      onUserJoin: ({ clientId, position }) => {
        this.allocateCharacter(clientId, position);
      },
      onUserLeave: (clientId) => {
        this.freeCharacter(clientId);
      },
      onOtherMouseClickPoint: ({ clientId, position }) => {
        this.othersMouseClickPoint.set(clientId, position);
      },
      onChat: ({ clientId, message }) => {
        const character = this.allCharacters.find(
          (controls) => controls.id == clientId
        );
        character.showChatbubble(message, this.sceneController.getScene());
      },
    });
  }

  public startListenOnMessageSent() {
    this.messageController.onMessageSent((message) => {
      this.myCharacter.showChatbubble(message, this.sceneController.getScene());
      this.networkController.emitChatMessage(message);
    });
  }

  public update() {
    const mixerUpdateDelta = this.clock.getDelta();
    if (this.mouseInputController.getIsMouseDown()) {
      this.mouseClickPoint = this.sceneController.raycastMouseClickPoint(
        this.mouseInputController.getMouse()
      );
      this.networkController.emitMouseClickPoint(this.mouseClickPoint);
    }
    for (let i = 0; i < this.allCharacters.length; ++i) {
      const controls = this.allCharacters[i];
      if (controls.id === "me") {
        controls.update(mixerUpdateDelta, this.mouseClickPoint);
      } else {
        controls.update(
          mixerUpdateDelta,
          this.othersMouseClickPoint.get(controls.id)
        );
      }
    }

    this.sceneController.render();
  }

  private allocateCharacter(clientId: string, position?: THREE.Vector3) {
    if (this.preservedOtherCharacters.length == 0) {
      return;
    }
    const controls = this.preservedOtherCharacters.shift();
    controls.id = clientId;
    controls.model.scale.y *= -1;
    if (position) {
      controls.model.position.x = position.x;
      controls.model.position.z = position.z;
    }
    this.allCharacters.push(controls);
  }

  private _freeCharacter(character: Character) {
    character.model.position.x = 0;
    character.model.position.z = 0;
    character.model.scale.y *= -1;
    this.preservedOtherCharacters.push(character);
  }

  private freeCharacter(clientId: string) {
    const index = this.allCharacters.findIndex(
      (character) => character.id == clientId
    );
    if (index !== -1) {
      const character = this.allCharacters[index];
      this._freeCharacter(character);
      this.allCharacters.splice(index, 1);
      this.othersMouseClickPoint.delete(clientId);
    }
  }

  private freeAllOthersCharacter() {
    for (let i = 1; i < this.allCharacters.length; ++i) {
      this._freeCharacter(this.allCharacters[i]);
    }
    this.allCharacters = [this.allCharacters[0]];
    this.othersMouseClickPoint.clear();
  }
}
