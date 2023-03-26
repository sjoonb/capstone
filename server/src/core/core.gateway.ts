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

@WebSocketGateway(80)
export class CoreGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: any, ...args: any[]) {
    console.log(`Client ${client.id} connected`);
    const clientId = client.id;
    client.broadcast.emit('user-join', clientId);
  }

  handleDisconnect(client: any) {
    console.log(`Client ${client.id} disconnected`);
    const clientId = client.id;
    client.broadcast.emit('user-leave', clientId);
  }

  @SubscribeMessage('mouse-click-point')
  handleChatEvent(
    @MessageBody() mouseClickPoint: string,
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;
    console.log(mouseClickPoint);
    client.broadcast.emit('mouse-click-point', { clientId, mouseClickPoint });
  }
}
