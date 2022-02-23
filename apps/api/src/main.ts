/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { API, Updates, Upload } from "vk-io";

import { AppModule } from './app/app.module';
import { environment } from './environments/environment.prod';

async function bootstrap() {
  const api = new API({
    token: environment.token
  })
  const upload = new Upload({
    api
  });
  const updates = new Updates({
    api,
    upload
  });
  // const users = await api.messages.getConversations({
  //   filter: 'unread',
  //   extended: 1
  // });
  const chat = await api.messages.getConversationsById({
    peer_ids: 2000000002
  });
  console.log(chat);
  const messages = await api.messages.send({
    peer_id: 2000000002,
    random_id: Math.random() * 2000000,
    message: ''
  });
  console.log(messages);
  // console.trace(users.items.map((item) => item.conversation));
  updates.on('message_new', (context) => {
    console.log(context);
  });
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3002;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap().catch(console.error);
