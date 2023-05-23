import { Socket, io } from "socket.io-client";
import * as THREE from "three";

interface SocketCallbackOptions {
  onConnect?: () => void;
  onFull?: () => void;
  onDisconnect?: () => void;
  onOthersInitialPos?: (characterPositions: {
    [key: string]: THREE.Vector3;
  }) => void;
  onUserJoin?: ({
    clientId,
    position,
  }: {
    clientId: string;
    position: THREE.Vector3;
  }) => void;
  onUserLeave?: (clientId: string) => void;
  onOtherMouseClickPoint?: ({
    clientId,
    position,
  }: {
    clientId: string;
    position: THREE.Vector3;
  }) => void;
  onChat?: (data: any) => void;
}

export class NetworkController {
  private socket: Socket;
  private endPointUrl: string;

  constructor({ endPointUrl }: { endPointUrl: string }) {
    this.endPointUrl = endPointUrl;
  }

  public initSocketService(callbacks: SocketCallbackOptions) {
    this.socket = io(this.endPointUrl, {
      transports: ["websocket"],
      reconnection: true,
    });

    this.socket.on("connect", () => {
      callbacks.onConnect();
    });

    this.socket.on("full", () => {
      callbacks.onFull?.();
    });

    this.socket.on("disconnect", () => {
      callbacks.onDisconnect?.();
    });

    this.socket.on(
      "others-pos",
      (characterPositions: { [key: string]: THREE.Vector3 }) => {
        console.log(characterPositions);
        callbacks.onOthersInitialPos?.(characterPositions);
      }
    );

    this.socket.on("user-join", (data) => {
      console.log("user-join");
      const { clientId, position } = data;
      callbacks.onUserJoin?.({ clientId, position });
    });

    this.socket.on("user-leave", (clientId) => {
      callbacks.onUserLeave?.(clientId);
    });

    this.socket.on("mouse-click-point", (data) => {
      const { clientId, mouseClickPoint } = data;
      const { x, y, z } = mouseClickPoint;
      const position = new THREE.Vector3(x, y, z);
      callbacks.onOtherMouseClickPoint?.({ clientId, position });
    });

    this.socket.on("chat", (data) => {
      callbacks.onChat?.(data);
    });
  }

  public emitMyChracterInitialPosition(position: THREE.Vector3) {
    this.socket.emit("init-pos", position);
  }

  public emitMouseClickPoint(position: THREE.Vector3) {
    this.socket.emit("mouse-click-point", position);
  }

  public emitChatMessage(message: string) {
    this.socket.emit("chat", message);
  }

  public emitSyncPos(position: THREE.Vector3) {
    this.socket.emit("sync-pos", position);
  }

  public disconnectSocket() {
    this.socket.disconnect();
  }

  public async fetchCanvasState() {
    return this._fetchCanvasState();
  }

  private async _fetchCanvasState() {
    try {
      const response = await fetch(`${this.endPointUrl}/canvas/load`);
      return response.json();
    } catch (error) {
      console.error("Error fetching canvas state:", error);
      return null;
    }
  }
}
