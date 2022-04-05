import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { inviteUser, parseMessage } from "@bot-sadvers/api/vk/message.vk";
import { VK } from "vk-io";
import { environment } from "../../environments/environment.prod";
import { connect } from "mongoose";

export const vk = new VK({
  token: environment.token,
  apiVersion: '5.131',
  pollingGroupId: environment.groupId as number
});

export function vk_initialize() {
  vk.updates.on('chat_invite_user', (message) => {
    console.log(message);
    if (!message.isOutbox && message.peerType == PeerTypeVkEnum.CHAT) {
      inviteUser(message).catch(console.error);
    }
  });

  vk.updates.on('message_new', (message) => {
    console.log(message);
    if (!message.isOutbox && message.peerType == PeerTypeVkEnum.CHAT) {
      parseMessage(message).catch(console.error);
    }
  });

  connect(environment.db).then(() => console.log('База данных VK подключена')).catch(console.error);
  vk.updates.start().then(() => {
    console.log('Сервер VK запущен');
  }).catch(console.error);
}
