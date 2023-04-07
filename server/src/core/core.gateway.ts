import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Vector3 } from './core.entity';

@WebSocketGateway({ host: '0.0.0.0' })
export class CoreGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private characterPositions: { [key: string]: Vector3 } = {};

  @WebSocketServer() server: Server;

  handleConnection(client: any, ...args: any[]) {
    const alreadyConnected = Object.keys(this.characterPositions).length;
    const clientId = client.id;
    if (alreadyConnected >= 4) {
      client.disconnect();
      return;
    }

    client.emit('others-pos', this.characterPositions);
    this.characterPositions[clientId] = { x: 0, y: 0, z: 0 };
    client.broadcast.emit('user-join', clientId);
    console.log(this.characterPositions);
  }

  handleDisconnect(client: any) {
    console.log(`Client ${client.id} disconnected`);
    const clientId = client.id;
    delete this.characterPositions[clientId];
    client.broadcast.emit('user-leave', clientId);
  }

  @SubscribeMessage('mouse-click-point')
  handleMouseClickEvent(
    @MessageBody() mouseClickPoint: string,
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;
    client.broadcast.emit('mouse-click-point', { clientId, mouseClickPoint });
  }

  @SubscribeMessage('chat')
  handleChatEvent(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;
    client.broadcast.emit('chat', { clientId, message });
  }

  /**
   * 
   * @param position 
   * @param client 
   * 
   네트워크 지연시간 만큼의 desync 가능성이 존재한다. 서버에서 직접 mouse click point 를 
   통해 position 을 계산하는 방법도 고려해야 한다.
   */

  @SubscribeMessage('sync-pos')
  handleSyncPosition(
    @MessageBody() position: Vector3,
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;
    this.characterPositions[clientId] = position;
  }
}
