/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { VK } from "vk-io";

import { environment } from './environments/environment.prod';

async function bootstrap() {
  const vk = new VK({
    token: environment.token,
    apiVersion: '5.131'
  });
  await vk.updates.startPolling();
  console.log('Сервер запущен');
  vk.updates.on('message', (message) => {
    if (!message.isOutbox) {
      message.send(message.text);
    }
  });

  // const app = await NestFactory.create(AppModule);
  // const globalPrefix = 'api';
  // app.setGlobalPrefix(globalPrefix);
  // const port = process.env.PORT || 3002;
  // await app.listen(port);
  // Logger.log(
  //   `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  // );
}

bootstrap().catch(console.error);
