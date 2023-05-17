import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreGateway } from './core/core.gateway';
import { ConfigModule } from '@nestjs/config';
import { CanvasController } from './canvas/canvas.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, CanvasController],
  providers: [AppService, CoreGateway],
})
export class AppModule {}
