import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreGateway } from './core/core.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, CoreGateway],
})
export class AppModule {}
