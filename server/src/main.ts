import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.use('/canvas/save', json({ limit: '50mb' }));
  app.use(json({ limit: '100kb' }));

  await app.listen(parseInt(process.env.PORT) || 3333, '0.0.0.0');
}
bootstrap();
