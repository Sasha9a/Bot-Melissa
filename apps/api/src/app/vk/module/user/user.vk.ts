import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/error.utils.vk";
import { createChat } from "@bot-sadvers/api/vk/module/chat/chat.utils.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import { createUser, getResolveResource, isOwnerMember, parseMention, stringifyMention, templateGetUser } from "./user.utils.vk";
import * as moment from "moment-timezone";

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

export async function kick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nКик [пользователь]');
    }
    let currentUser: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!currentUser) {
      currentUser = await createUser(req.msgObject.senderId, req);
    }
    const user: User = await UserModule.findOne({ peerId: parseMention(req.text[0])?.id, chatId: req.msgObject.peerId });
    if (!user) {
      return errorSend(req.msgObject, 'Нет такого пользователя');
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (currentUser.status <= user.status && !await isOwnerMember(currentUser.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для кика');
    }
    await vk.api.messages.removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId }).catch(console.error);
    req.msgObject.send(`${await stringifyMention(user.peerId)} исключен из беседы`).catch(console.error);
  }
}

export async function autoKick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nАвтокик [пользователь]');
    }
    let currentUser: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!currentUser) {
      currentUser = await createUser(req.msgObject.senderId, req);
    }
    const resource = await getResolveResource(req.text[0]);
    if (!resource || !['user', 'group'].includes(resource.type)) {
      return errorSend(req.msgObject, 'Первый параметр неверный');
    }
    const user: User = await UserModule.findOne({ peerId: resource.id, chatId: req.msgObject.peerId });
    if (await isOwnerMember(resource.id, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (user && currentUser.status <= user.status && !await isOwnerMember(currentUser.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для автокика');
    }
    await vk.api.messages.removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: resource.id, user_id: resource.id }).catch(console.error);
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    if (!chat.autoKickList) {
      chat.autoKickList = [];
    }
    if (chat.autoKickList.findIndex((u) => u === resource.id) !== -1) {
      return errorSend(req.msgObject, `Пользователь ${await stringifyMention(resource.id)} уже в автокике`);
    }
    chat.autoKickList.push(resource.id);
    await chat.save();
    req.msgObject.send(`Пользователь ${await stringifyMention(resource.id)} добавлен в автокик`).catch(console.error);
  }
}

export async function autoKickMinus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nАвтокик- [пользователь]');
    }
    const resource = await getResolveResource(req.text[0]);
    if (!resource || !['user', 'group'].includes(resource.type)) {
      return errorSend(req.msgObject, 'Первый параметр неверный');
    }
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    if (!chat.autoKickList) {
      chat.autoKickList = [];
    }
    if (chat.autoKickList.findIndex((id) => id === resource.id) !== -1) {
      chat.autoKickList = chat.autoKickList.filter((id) => id !== resource.id);
      await chat.save();
      req.msgObject.send(`Пользователь ${await stringifyMention(resource.id)} удален из автокика`).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Пользователь ${await stringifyMention(resource.id)} не находится в списке автокика`);
    }
  }
}

export async function ban(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nБан [пользователь] [кол-во дней]');
    }
    let currentUser: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!currentUser) {
      currentUser = await createUser(req.msgObject.senderId, req);
    }
    const resource = await getResolveResource(req.text[0]);
    if (!resource || !['user', 'group'].includes(resource.type)) {
      return errorSend(req.msgObject, 'Первый параметр неверный');
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 1 || Number(req.text[1]) > 90) {
      return errorSend(req.msgObject, 'Второй аргумент не верный (1-90 дней)');
    }
    const user: User = await UserModule.findOne({ peerId: resource.id, chatId: req.msgObject.peerId });
    if (await isOwnerMember(resource.id, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (user && currentUser.status <= user.status && !await isOwnerMember(currentUser.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для бана');
    }
    await vk.api.messages.removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: resource.id, user_id: resource.id }).catch(console.error);
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    if (!chat.banList) {
      chat.banList = [];
    }
    if (chat.banList.findIndex((u) => u.id === resource.id) !== -1) {
      return errorSend(req.msgObject, `Пользователь ${await stringifyMention(resource.id)} уже в банлисте`);
    }
    chat.banList.push({
      id: resource.id,
      endDate: moment().add(Number(req.text[1]), 'days').toDate()
    });
    chat.markModified('banList');
    await chat.save();
    req.msgObject.send(`Пользователь ${await stringifyMention(resource.id)} добавлен в банлист на ${Number(req.text[1])} дн.`).catch(console.error);
  }
}

export async function banMinus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nБан- [пользователь]');
    }
    const resource = await getResolveResource(req.text[0]);
    if (!resource || !['user', 'group'].includes(resource.type)) {
      return errorSend(req.msgObject, 'Первый параметр неверный');
    }
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    if (!chat.banList) {
      chat.banList = [];
    }
    if (chat.banList.findIndex((u) => u.id === resource.id) !== -1) {
      chat.banList = chat.banList.filter((u) => u.id !== resource.id);
      chat.markModified('banList');
      await chat.save();
      req.msgObject.send(`Пользователь ${await stringifyMention(resource.id)} удален из банлиста`).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Пользователь ${await stringifyMention(resource.id)} не находится в списке банлиста`);
    }
  }
}

export async function warn(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nПред [пользователь] [кол-во]');
    }
    let currentUser: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!currentUser) {
      currentUser = await createUser(req.msgObject.senderId, req);
    }
    const resource = await getResolveResource(req.text[0]);
    if (!resource || !['user', 'group'].includes(resource.type)) {
      return errorSend(req.msgObject, 'Первый параметр неверный');
    }
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 1) {
      return errorSend(req.msgObject, `Второй аргумент не верный`);
    }
    const user: User = await UserModule.findOne({ peerId: resource.id, chatId: req.msgObject.peerId });
    if (await isOwnerMember(resource.id, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя наказать создателя беседы');
    }
    if (user && currentUser.status <= user.status && !await isOwnerMember(currentUser.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для наказания');
    }
    if (user.warn + Number(req.text[1]) >= chat.maxWarn) {
      user.warn = 0;
      await user.save();
      await vk.api.messages.removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: resource.id, user_id: resource.id }).catch(console.error);
      req.msgObject.send(`Пользователь ${await stringifyMention(resource.id)} был кикнут по достижению лимита кол-ва предупреждений`).catch(console.error);
    } else {
      user.warn += Number(req.text[1]);
      await user.save();
      req.msgObject.send(`Пользователь ${await stringifyMention(resource.id)} получает предупреждение в количестве: ${Number(req.text[1])} шт.`).catch(console.error);
    }
  }
}

export async function warnMinus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nСнять пред [пользователь] [кол-во]');
    }
    let currentUser: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!currentUser) {
      currentUser = await createUser(req.msgObject.senderId, req);
    }
    const resource = await getResolveResource(req.text[0]);
    if (!resource || !['user', 'group'].includes(resource.type)) {
      return errorSend(req.msgObject, 'Первый параметр неверный');
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 1) {
      return errorSend(req.msgObject, `Второй аргумент не верный`);
    }
    const user: User = await UserModule.findOne({ peerId: resource.id, chatId: req.msgObject.peerId });
    if (user && currentUser.status <= user.status && !await isOwnerMember(currentUser.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для снятия наказания');
    }
    if (user.warn === 0) {
      return errorSend(req.msgObject, `У пользователя ${await stringifyMention(resource.id)} нет предупреждений`);
    }
    if (user.warn - Number(req.text[1]) < 0) {
      user.warn = 0;
    } else {
      user.warn -= Number(req.text[1]);
    }
    await user.save();
    req.msgObject.send(`Пользователю ${await stringifyMention(resource.id)} сняли предупреждение в количестве: ${Number(req.text[1])} шт.`).catch(console.error);
  }
}

export async function warnList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Список пользователей с предом:';
    const users: User[] = await UserModule.find({ warn: { $ne: 0 }, chatId: req.msgObject.peerId });
    if (!users.length) {
      req.msgObject.send(`Список пользователей с предом пустой`).catch(console.error);
    } else {
      let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
      if (!chat) {
        chat = await createChat(req.msgObject.peerId);
      }
      for (const user of users) {
        result = result.concat(`\n${await stringifyMention(user.peerId)}: ${user.warn} / ${chat.maxWarn}`);
      }
      req.msgObject.send(result).catch(console.error);
    }
  }
}

export async function clearWarnList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    await UserModule.updateMany({ warn: { $ne: 0 }, chatId: req.msgObject.peerId }, { warn: 0 });
    req.msgObject.send(`Список пользователей с предом очищен`).catch(console.error);
  }
}
