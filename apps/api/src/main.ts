/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { vk_initialize } from "@bot-sadvers/api/core/vk";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors();
  const port = process.env.PORT || 3002;
  await app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}/${globalPrefix}`);
  });

  vk_initialize();
}

bootstrap().catch(console.error);
