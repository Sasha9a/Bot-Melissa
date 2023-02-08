import { parseAdminMessage } from '@bot-melissa/app/admin.message.vk';
import { PeerTypeVkEnum } from '@bot-melissa/app/core/enums/peer.type.vk.enum';
import { inviteUser, kickUser, messageEvent, parseMessage } from '@bot-melissa/app/message.vk';
import { checkTimeMarriage } from '@bot-melissa/app/module/marriage/marriage.utils.vk';
import { autoKickInDays } from '@bot-melissa/app/module/user/user.utils.vk';
import { connect } from 'mongoose';
import * as schedule from 'node-schedule';
import { VK } from 'vk-io';
import { environment } from '../environments/environment';

export const vk = new VK({
  token: environment.token,
  apiVersion: '5.131',
  pollingGroupId: environment.groupId as number
});

export const botInit = () => {
  vk.updates.on('chat_invite_user', (message) => {
    console.log(message);
    if (!message.isOutbox) {
      inviteUser(message).catch(console.error);
    }
  });

  vk.updates.on('chat_invite_user_by_link', (message) => {
    console.log(message);
    if (!message.isOutbox) {
      inviteUser(message).catch(console.error);
    }
  });

  vk.updates.on('chat_kick_user', (message) => {
    console.log(message);
    if (!message.isOutbox) {
      kickUser(message).catch(console.error);
    }
  });

  vk.updates.on('message_new', (message) => {
    console.log(message);
    if (message.peerType == PeerTypeVkEnum.USER && message.peerId === 283215047) {
      parseAdminMessage(message).catch(console.error);
      return;
    }
    if (!message.isOutbox) {
      parseMessage(message).catch(console.error);
    }
  });

  vk.updates.on('message_event', (message) => {
    console.log(message);
    messageEvent(message).catch(console.error);
  });

  connect(environment.db)
    .then(() => console.log('База данных VK подключена'))
    .catch(console.error);
  vk.updates
    .start()
    .then(() => {
      console.log('Сервер VK запущен');
    })
    .catch(console.error);

  schedule.scheduleJob('* * * * *', () => {
    console.log('Запущен ежеминутный крон');
    checkTimeMarriage();
  });

  schedule.scheduleJob('* 4 * * *', () => {
    console.log('Запущен ежесуточный крон');
    autoKickInDays();
  });
};
