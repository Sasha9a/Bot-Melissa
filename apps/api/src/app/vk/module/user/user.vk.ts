import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { vk } from "@bot-sadvers/api/vk/vk";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import * as moment from "moment-timezone";

export async function updateAll(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const isOwner = await isOwnerMember(req.msgObject.senderId, req.msgObject.peerId);
    if (isOwner) {
      const members = await vk.api.messages.getConversationMembers({ peer_id: req.msgObject.peerId });
      for (const member of members.items) {
        let user: User = await UserModule.findOne({ peerId: member.member_id, chatId: req.msgObject.peerId });
        if (!user) {
          user = await createUser(req);
        }
        if (member.is_owner) {
          user.status = 10;
        }
        if (!user.joinDate) {
          user.joinDate = new Date(member.join_date * 1000);
        }
        await user.save();
      }
      req.msgObject.send(`Данные беседы обновлены`).catch(console.error);
    }
  }
}

export async function setNick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return req.msgObject.send(`${await formMention(req.msgObject.senderId)}: Вы не ввели ник`).catch(console.error);
    }
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req);
    }
    user.nick = req.fullText;
    await user.save();
    req.msgObject.send(`Установлен ник для ${await formMention(req.msgObject.senderId)}: "${req.fullText}"`).catch(console.error);
  }
}

export async function setIcon(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return req.msgObject.send(`${await formMention(req.msgObject.senderId)}: Вы не ввели значок`).catch(console.error);
    }
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req);
    }
    user.icon = req.fullText;
    await user.save();
    req.msgObject.send(`Установлен значок для ${await formMention(req.msgObject.senderId)}: "${req.fullText}"`).catch(console.error);
  }
}

export async function getUser(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req);
    }
    let result = `Участник ${await formMention(req.msgObject.senderId)}:`;
    if (user?.joinDate) {
      result = result.concat(`\nВ беседе c ${moment(user.joinDate).format('DD.MM.YYYY HH:mm ')} (${moment().diff(user.joinDate, 'days')} дн.)`);
    } else {
      result = result.concat(`\nВ беседе c -`);
    }
    result = result.concat(`\nНик: ${user?.nick || '-'}`);
    result = result.concat(`\nЗначок: ${user?.icon || '-'}`);
    result = result.concat(`\nСтатус: ${user?.status || 0}`);
    req.msgObject.send(result).catch(console.error);
  }
}

export async function createUser(req: RequestMessageVkModel): Promise<User> {
  const user: User = new UserModule({
    peerId: req.msgObject.senderId,
    chatId: req.msgObject.peerId,
    status: 0
  });
  return await user.save();
}

export async function formMention(userId: number): Promise<string> {
  const dataUser = await vk.api.users.get({ user_ids: [userId] });
  return `[id${dataUser[0].id}|${dataUser[0].first_name + ' ' + dataUser[0].last_name}]`;
}

export async function isOwnerMember(peerId: number, chatId: number): Promise<boolean> {
  const members = await vk.api.messages.getConversationMembers({ peer_id: chatId });
  const user = members.items.find((member) => member.member_id === peerId);
  return user.is_owner as boolean;
}
