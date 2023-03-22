import { io, Socket } from "socket.io-client";

export class SocketService {
  private readonly socket: Socket;

  constructor() {
    this.socket = io('http://127.0.0.1:80', {
      transports: ["websocket"],
      closeOnBeforeunload: false,
    });
    // this.socket.connect();
    this.socket.on("connect", () => {
      // this.socketId = this.socket.id;
      console.log('connected');
    });
  }
}

