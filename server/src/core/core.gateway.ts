import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway(80)
export class CoreGateway {
  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    console.log(payload);
    return 'Hello world!';
  }
}
