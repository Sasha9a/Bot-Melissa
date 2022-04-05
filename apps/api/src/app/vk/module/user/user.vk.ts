import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/error.utils.vk";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import { createUser, isOwnerMember, parseMention, stringifyMention, templateGetUser } from "./user.utils.vk";

export async function setNickMe(req: RequestMessageVkModel) {
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

export async function setNick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nНик [пользователь] [ник]');
    }
    const user: User = await UserModule.findOne({ peerId: parseMention(req.text[0])?.id, chatId: req.msgObject.peerId });
    if (!user) {
      return errorSend(req.msgObject, 'Нет такого пользователя');
    }
    user.nick = req.fullText.substring(req.fullText.indexOf(req.text[1]));
    await user.save();
    req.msgObject.send(`Установлен ник для ${await stringifyMention(parseMention(req.text[0])?.id)}: "${user.nick}"`).catch(console.error);
  }
}

export async function setIconMe(req: RequestMessageVkModel) {
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

export async function setIcon(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nЗначок [пользователь] [значок]');
    }
    const user: User = await UserModule.findOne({ peerId: parseMention(req.text[0])?.id, chatId: req.msgObject.peerId });
    if (!user) {
      return errorSend(req.msgObject, 'Нет такого пользователя');
    }
    user.icon = req.fullText.substring(req.fullText.indexOf(req.text[1]));
    await user.save();
    req.msgObject.send(`Установлен значок для ${await stringifyMention(parseMention(req.text[0])?.id)}: "${user.icon}"`).catch(console.error);
  }
}

export async function getUserMe(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req.msgObject.senderId, req);
    }
    req.msgObject.send(await templateGetUser(user)).catch(console.error);
  }
}

export async function getUser(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nКто [пользователь]');
    }
    const user: User = await UserModule.findOne({ peerId: parseMention(req.text[0])?.id, chatId: req.msgObject.peerId });
    if (!user) {
      return errorSend(req.msgObject, 'Нет такого пользователя');
    }
    req.msgObject.send(await templateGetUser(user)).catch(console.error);
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

export async function getStatuses(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Статус пользователей:';
    const users: User[] = await UserModule.find({ status: { $ne: 0 }, chatId: req.msgObject.peerId });
    for (let i = 10; i != 0; i--) {
      const usersStatus = users.filter((u) => u.status === i);
      if (usersStatus.length) {
        const status: Status = await StatusModule.findOne({ status: i, chatId: req.msgObject.peerId });
        if (status) {
          result = result.concat(`\n\n"${status?.name}" (${i}):`);
        } else {
          result = result.concat(`\n\nСтатус ${i}:`);
        }
        for (const u of usersStatus) {
          result = result.concat(`\n${await stringifyMention(u.peerId)}`);
        }
      }
    }
    req.msgObject.send(result).catch(console.error);
  }
}
