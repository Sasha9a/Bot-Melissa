import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/error.utils.vk";
import { createCommand } from "@bot-sadvers/api/vk/module/status/status.utils.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Command, CommandModule } from "@bot-sadvers/shared/schemas/command.schema";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import * as moment from "moment-timezone";
import { createUser, isOwnerMember, parseMention, stringifyMention } from "./user.utils.vk";

export async function updateAll(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const isOwner = await isOwnerMember(req.msgObject.senderId, req.msgObject.peerId);
    if (isOwner) {
      const members = await vk.api.messages.getConversationMembers({ peer_id: req.msgObject.peerId });
      for (const member of members.items) {
        let user: User = await UserModule.findOne({ peerId: member.member_id, chatId: req.msgObject.peerId });
        if (!user) {
          user = await createUser(member.member_id, req);
        }
        if (member.is_owner) {
          user.status = 10;
        }
        if (!user.joinDate) {
          user.joinDate = new Date(member.join_date * 1000);
        }
        await user.save();
      }
      const commandArray = [CommandVkEnum.setCommandStatus, CommandVkEnum.updateAll];
      for (const comm of commandArray) {
        const command: Command = await CommandModule.findOne({ chatId: req.msgObject.peerId, command: comm });
        if (!command) {
          await createCommand(comm, 10, req.msgObject.peerId);
        }
      }
      req.msgObject.send(`Данные беседы обновлены`).catch(console.error);
    }
  }
}

export async function setNick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return errorSend(req.msgObject, 'Вы не ввели ник');
    }
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req.msgObject.senderId, req);
    }
    user.nick = req.fullText;
    await user.save();
    req.msgObject.send(`Установлен ник для ${await stringifyMention(req.msgObject.senderId)}: "${req.fullText}"`).catch(console.error);
  }
}

export async function setIcon(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return errorSend(req.msgObject, 'Вы не ввели значок');
    }
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req.msgObject.senderId, req);
    }
    user.icon = req.fullText;
    await user.save();
    req.msgObject.send(`Установлен значок для ${await stringifyMention(req.msgObject.senderId)}: "${req.fullText}"`).catch(console.error);
  }
}

export async function getUser(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req.msgObject.senderId, req);
    }
    const status: Status = await StatusModule.findOne({ chatId: req.msgObject.peerId, status: user?.status });
    let result = `Участник ${await stringifyMention(req.msgObject.senderId)}:`;
    if (user?.joinDate) {
      result = result.concat(`\nВ беседе c ${moment(user.joinDate).format('DD.MM.YYYY HH:mm ')} (${moment().diff(user.joinDate, 'days')} дн.)`);
    } else {
      result = result.concat(`\nВ беседе c -`);
    }
    result = result.concat(`\nНик: ${user?.nick || '-'}`);
    result = result.concat(`\nЗначок: ${user?.icon || '-'}`);
    if (status?.name?.length) {
      result = result.concat(`\nСтатус: ${status.name} (${user?.status || 0})`);
    } else {
      result = result.concat(`\nСтатус: ${user?.status || 0}`);
    }
    req.msgObject.send(result).catch(console.error);
  }
}

export async function setStatus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nСтатус [пользователь] [номер статуса]');
    }
    let currentUser: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!currentUser) {
      currentUser = await createUser(req.msgObject.senderId, req);
    }
    const user: User = await UserModule.findOne({ peerId: parseMention(req.text[0])?.id, chatId: req.msgObject.peerId });
    if (!user) {
      return errorSend(req.msgObject, 'Нет такого пользователя');
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 0 || Number(req.text[1]) > 10) {
      return errorSend(req.msgObject, 'Второй аргумент не верный');
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя менять статус создателю беседы');
    }
    if ((currentUser.status <= Number(req.text[1]) && !await isOwnerMember(currentUser.peerId, req.msgObject.peerId))
      || (currentUser.status <= user.status && !await isOwnerMember(currentUser.peerId, req.msgObject.peerId))) {
      return errorSend(req.msgObject, 'Нет прав для выдачи такого статуса');
    }
    user.status = Number(req.text[1]);
    await user.save();
    req.msgObject.send(`Установлен статус ${req.text[1]} для ${await stringifyMention(user.peerId)}`).catch(console.error);
  }
}
