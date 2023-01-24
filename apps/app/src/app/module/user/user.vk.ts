import { PeerTypeVkEnum } from '@bot-melissa/app/core/enums/peer.type.vk.enum';
import { RequestMessageVkModel } from '@bot-melissa/app/core/models/request.message.vk.model';
import { errorSend, yesSend } from '@bot-melissa/app/core/utils/customMessage.utils.vk';
import { createAntispam } from '@bot-melissa/app/module/chat/chat.utils.vk';
import { vk } from '@bot-melissa/app/vk';
import { CommandVkEnum } from '@bot-melissa/shared/enums/command.vk.enum';
import { Antispam, AntispamModule } from '@bot-melissa/shared/schemas/antispam.schema';
import { Status, StatusModule } from '@bot-melissa/shared/schemas/status.schema';
import { User, UserModule } from '@bot-melissa/shared/schemas/user.schema';
import * as moment from 'moment-timezone';
import { environment } from '../../../environments/environment';
import { getFullUserInfo, isOwnerMember, stringifyMention, templateGetUser } from './user.utils.vk';

export const setNickMe = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return errorSend(req.msgObject, 'Вы не ввели ник');
    }
    req.user.info.nick = req.fullText;
    await req.user.info.save();
    await yesSend(
      req.msgObject,
      `Установлен ник для ${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}: "${req.fullText}"`
    );
  }
};

export const setNick = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if ((!req.replyMsgSenderId && req.text.length < 2) || (req.replyMsgSenderId && req.text.length < 1)) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} ник [пользователь] [ник]`);
    }
    const user: User = await getFullUserInfo(req.replyMsgSenderId ? String(req.replyMsgSenderId) : req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    user.nick = req.replyMsgSenderId ? req.fullText : req.fullText.substring(req.fullText.indexOf(req.text[1]));
    await user.save();
    await yesSend(
      req.msgObject,
      `Установлен ник для ${await stringifyMention({
        userId: user.peerId,
        userInfo: req.members.find((m) => m.id === user.peerId)?.profile
      })}: "${user.nick}"`
    );
  }
};

export const setIconMe = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return errorSend(req.msgObject, 'Вы не ввели значок');
    }
    req.user.info.icon = req.fullText;
    await req.user.info.save();
    await yesSend(
      req.msgObject,
      `Установлен значок для ${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}: "${req.fullText}"`
    );
  }
};

export const setIcon = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2 && req.replyMsgSenderId && req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} значок [пользователь] [значок]`);
    }
    const user: User = await getFullUserInfo(req.replyMsgSenderId ? String(req.replyMsgSenderId) : req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    user.icon = req.text[1] ?? req.text[0];
    await user.save();
    await yesSend(
      req.msgObject,
      `Установлен значок для ${await stringifyMention({
        userId: user.peerId,
        userInfo: req.members.find((m) => m.id === user.peerId)?.profile
      })}: "${user.icon}"`
    );
  }
};

export const setAgeMe = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} мне возраст [возраст]`);
    }
    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 1 || Number(req.text[0]) > 100) {
      return errorSend(req.msgObject, 'Первый аргумент не верный (1-100)');
    }
    req.user.info.age = Number(req.text[0]);
    await req.user.info.save();
    await yesSend(
      req.msgObject,
      `Установлен возраст для ${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}: "${Number(
        req.text[0]
      )}"`
    );
  }
};

export const setAboutMe = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return errorSend(req.msgObject, 'Вы не ввели текст');
    }
    req.user.info.aboutMe = req.fullText;
    await req.user.info.save();
    await yesSend(
      req.msgObject,
      `${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })} графа "О себе" сохранен`
    );
  }
};

export const getUser = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length > 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} участник [пользователь]`);
    }
    if (req.text.length === 1 || req.replyMsgSenderId) {
      const user: User = await getFullUserInfo(req.replyMsgSenderId ? String(req.replyMsgSenderId) : req.text[0], req.msgObject);
      if (!user) {
        return;
      }
      req.msgObject.send(await templateGetUser(req, user.peerId), { disable_mentions: true }).catch(console.error);
    } else {
      req.msgObject.send(await templateGetUser(req, req.user.id), { disable_mentions: true }).catch(console.error);
    }
  }
};

export const setStatus = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2 && req.replyMsgSenderId && req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} статус [пользователь] [номер статуса]`);
    }
    const user: User = await getFullUserInfo(req.replyMsgSenderId ? String(req.replyMsgSenderId) : req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    const numberStatus = Number(req.text[1] ?? req.text[0]);
    if (isNaN(numberStatus) || numberStatus < 0 || numberStatus > 10) {
      return errorSend(req.msgObject, 'Второй аргумент не верный');
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя менять статус создателю беседы');
    }
    if (
      (req.user.info.status <= numberStatus && !(await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))) ||
      (req.user.info.status <= user.status && !(await isOwnerMember(req.user.info.peerId, req.msgObject.peerId)))
    ) {
      return errorSend(req.msgObject, 'Нет прав для выдачи такого статуса');
    }
    user.status = numberStatus;
    await user.save();
    await yesSend(
      req.msgObject,
      `Установлен статус ${numberStatus} для ${await stringifyMention({
        userId: user.peerId,
        userInfo: req.members.find((m) => m.id === user.peerId)?.profile
      })}`
    );
  }
};

export const getStatuses = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Статус пользователей:';
    const users: User[] = await UserModule.find({ status: { $ne: 0 }, chatId: req.msgObject.peerId }, { status: 1, peerId: 1, icon: 1 });
    for (let i = 10; i != 0; i--) {
      const usersStatus = users.filter((u) => u.status === i);
      if (usersStatus.length) {
        const status: Status = await StatusModule.findOne({ status: i, chatId: req.msgObject.peerId }, { name: 1 });
        if (status) {
          result = result.concat(`\n\n"${status?.name}" (${i}):`);
        } else {
          result = result.concat(`\n\nСтатус ${i}:`);
        }
        for (const u of usersStatus) {
          result = result.concat(
            `\n${await stringifyMention({ userId: u.peerId, userInfo: req.members.find((m) => m.id === u.peerId)?.profile })}`
          );
          if (u.icon?.length) {
            result = result.concat(` ${u.icon}`);
          }
        }
      }
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
};

export const kick = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1 && !req.replyMsgSenderId) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} кик [пользователь]`);
    }
    const user: User = await getFullUserInfo(req.text[0] ?? String(req.replyMsgSenderId), req.msgObject);
    if (!user) {
      return;
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (req.user.info.status <= user.status && !(await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))) {
      return errorSend(req.msgObject, 'Нет прав для кика');
    }
    await vk.api.messages
      .removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId })
      .then(async () => {
        await yesSend(
          req.msgObject,
          `${await stringifyMention({
            userId: user.peerId,
            userInfo: req.members.find((m) => m.id === user.peerId)?.profile
          })} исключен из беседы`
        );
      })
      .catch(console.error);
  }
};

export const autoKick = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1 && !req.replyMsgSenderId) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} автокик [пользователь]`);
    }
    const user: User = await getFullUserInfo(req.text[0] ?? String(req.replyMsgSenderId), req.msgObject);
    if (!user) {
      return;
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (req.user.info.status <= user.status && !(await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))) {
      return errorSend(req.msgObject, 'Нет прав для автокика');
    }
    await vk.api.messages
      .removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId, user_id: user.peerId })
      .catch(console.error);
    if (!req.chat.autoKickList) {
      req.chat.autoKickList = [];
    }
    if (req.chat.autoKickList.findIndex((u) => u === user.peerId) !== -1) {
      return errorSend(
        req.msgObject,
        `Пользователь ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} уже в автокике`
      );
    }
    req.chat.autoKickList.push(user.peerId);
    await req.chat.save();
    await yesSend(
      req.msgObject,
      `Пользователь ${await stringifyMention({
        userId: user.peerId,
        userInfo: req.members.find((m) => m.id === user.peerId)?.profile
      })} добавлен в автокик`
    );
  }
};

export const autoKickMinus = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} автокик- [пользователь]`);
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    if (!req.chat.autoKickList) {
      req.chat.autoKickList = [];
    }
    if (req.chat.autoKickList.findIndex((id) => id === user.peerId) !== -1) {
      req.chat.autoKickList = req.chat.autoKickList.filter((id) => id !== user.peerId);
      await req.chat.save();
      await yesSend(
        req.msgObject,
        `Пользователь ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} удален из автокика`
      );
    } else {
      await errorSend(
        req.msgObject,
        `Пользователь ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} не находится в списке автокика`
      );
    }
  }
};

export const ban = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2 && req.replyMsgSenderId && req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} бан [пользователь] [кол-во дней]`);
    }
    const user: User = await getFullUserInfo(req.replyMsgSenderId ? String(req.replyMsgSenderId) : req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    const days = Number(req.text[1] ?? req.text[0]);
    if (isNaN(days) || days < 1 || days > 90) {
      return errorSend(req.msgObject, 'Второй аргумент не верный (1-90 дней)');
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (req.user.info.status <= user.status && !(await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))) {
      return errorSend(req.msgObject, 'Нет прав для бана');
    }
    await vk.api.messages
      .removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId, user_id: user.peerId })
      .catch(console.error);
    if (!req.chat.banList) {
      req.chat.banList = [];
    }
    if (req.chat.banList.findIndex((u) => u.id === user.peerId) !== -1) {
      return errorSend(
        req.msgObject,
        `Пользователь ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} уже в банлисте`
      );
    }
    req.chat.banList.push({
      id: user.peerId,
      endDate: moment().add(days, 'days').toDate()
    });
    req.chat.markModified('banList');
    await req.chat.save();
    await yesSend(
      req.msgObject,
      `Пользователь ${await stringifyMention({
        userId: user.peerId,
        userInfo: req.members.find((m) => m.id === user.peerId)?.profile
      })} добавлен в банлист на ${days} дн.`
    );
  }
};

export const banMinus = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} бан- [пользователь]`);
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    if (!req.chat.banList) {
      req.chat.banList = [];
    }
    if (req.chat.banList.findIndex((u) => u.id === user.peerId) !== -1) {
      req.chat.banList = req.chat.banList.filter((u) => u.id !== user.peerId);
      req.chat.markModified('banList');
      await req.chat.save();
      await yesSend(
        req.msgObject,
        `Пользователь ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} удален из банлиста`
      );
    } else {
      await errorSend(
        req.msgObject,
        `Пользователь ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} не находится в списке банлиста`
      );
    }
  }
};

export const warn = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2 && req.replyMsgSenderId && req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} пред [пользователь] [кол-во]`);
    }
    const user: User = await getFullUserInfo(req.replyMsgSenderId ? String(req.replyMsgSenderId) : req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    const count = Number(req.text[1] ?? req.text[0]);
    if (isNaN(count) || count < 1) {
      return errorSend(req.msgObject, `Второй аргумент не верный`);
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя наказать создателя беседы');
    }
    if (req.user.info.status <= user.status && !(await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))) {
      return errorSend(req.msgObject, 'Нет прав для наказания');
    }
    if (user.warn + count >= req.chat.maxWarn) {
      user.warn = 0;
      await user.save();
      await vk.api.messages
        .removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId, user_id: user.peerId })
        .then(async () => {
          await yesSend(
            req.msgObject,
            `Пользователь ${await stringifyMention({
              userId: user.peerId,
              userInfo: req.members.find((m) => m.id === user.peerId)?.profile
            })} был кикнут по достижению лимита кол-ва предупреждений`
          );
        })
        .catch(console.error);
    } else {
      user.warn += count;
      await user.save();
      await yesSend(
        req.msgObject,
        `Пользователь ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} получает предупреждение в количестве: ${count} шт.`
      );
    }
  }
};

export const warnMinus = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2 && req.replyMsgSenderId && req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} снять пред [пользователь] [кол-во]`);
    }
    const user: User = await getFullUserInfo(req.replyMsgSenderId ? String(req.replyMsgSenderId) : req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    const count = Number(req.text[1] ?? req.text[0]);
    if (isNaN(count) || count < 1) {
      return errorSend(req.msgObject, `Второй аргумент не верный`);
    }
    if (req.user.info.status <= user.status && !(await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))) {
      return errorSend(req.msgObject, 'Нет прав для снятия наказания');
    }
    if (user.warn === 0) {
      return errorSend(
        req.msgObject,
        `У пользователя ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} нет предупреждений`
      );
    }
    if (user.warn - count < 0) {
      user.warn = 0;
    } else {
      user.warn -= count;
    }
    await user.save();
    await yesSend(
      req.msgObject,
      `Пользователю ${await stringifyMention({
        userId: user.peerId,
        userInfo: req.members.find((m) => m.id === user.peerId)?.profile
      })} сняли предупреждение в количестве: ${count} шт.`
    );
  }
};

export const warnList = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Список пользователей с предом:';
    const users: User[] = await UserModule.find({ warn: { $ne: 0 }, chatId: req.msgObject.peerId });
    if (!users.length) {
      req.msgObject.send(`Список пользователей с предом пустой`).catch(console.error);
    } else {
      for (const user of users) {
        result = result.concat(
          `\n${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })}: ${
            user.warn
          } / ${req.chat.maxWarn}`
        );
      }
      req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
    }
  }
};

export const clearWarnList = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    await UserModule.updateMany({ warn: { $ne: 0 }, chatId: req.msgObject.peerId }, { warn: 0 });
    req.msgObject.send(`Список пользователей с предом очищен`).catch(console.error);
  }
};

export const mute = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2 && req.replyMsgSenderId && req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} мут [пользователь] [кол-во часов]`);
    }
    const user: User = await getFullUserInfo(req.replyMsgSenderId ? String(req.replyMsgSenderId) : req.text[0], req.msgObject);
    if (!user) {
      return;
    }
    const hours = Number(req.text[1] ?? req.text[0]);
    if (isNaN(hours) || hours < 1 || hours > 96) {
      return errorSend(req.msgObject, 'Второй аргумент не верный (1-96 часов)');
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя выдать мут создателю беседы');
    }
    if (req.user.info.status <= user.status && !(await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))) {
      return errorSend(req.msgObject, 'Нет прав для мута');
    }
    if (!req.chat.muteList) {
      req.chat.muteList = [];
    }
    if (req.chat.muteList.findIndex((u) => u.id === user.peerId) !== -1) {
      return errorSend(
        req.msgObject,
        `Пользователь ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} уже в муте`
      );
    }
    req.chat.muteList.push({
      id: user.peerId,
      endDate: moment().add(hours, 'hours').toDate()
    });
    req.chat.markModified('muteList');
    await req.chat.save();
    await yesSend(
      req.msgObject,
      `Пользователь ${await stringifyMention({
        userId: user.peerId,
        userInfo: req.members.find((m) => m.id === user.peerId)?.profile
      })} получает мут на ${hours} ч.`
    );
  }
};

export const muteMinus = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1 && !req.replyMsgSenderId) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} мут- [пользователь]`);
    }
    const user: User = await getFullUserInfo(req.text[0] ?? String(req.replyMsgSenderId), req.msgObject);
    if (!user) {
      return;
    }
    if (!req.chat.muteList) {
      req.chat.muteList = [];
    }
    if (req.chat.muteList.findIndex((u) => u.id === user.peerId) !== -1) {
      req.chat.muteList = req.chat.muteList.filter((u) => u.id !== user.peerId);
      req.chat.markModified('muteList');
      await req.chat.save();
      await yesSend(
        req.msgObject,
        `Пользователю ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} сняли мут`
      );
    } else {
      await errorSend(
        req.msgObject,
        `У пользователя ${await stringifyMention({
          userId: user.peerId,
          userInfo: req.members.find((m) => m.id === user.peerId)?.profile
        })} нет мута`
      );
    }
  }
};

export const convene = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} созвать [параметр]`);
    }
    let membersList = req.members.filter((m) => m.id !== req.msgObject.senderId && m.profile);
    let result = '';
    if (req.fullText === 'всех') {
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(
          `${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${
            i !== membersList.length - 1 ? ', ' : ''
          }`
        );
      }
    } else if (req.fullText === 'онлайн') {
      membersList = membersList.filter((m) => m.profile.online);
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(
          `${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${
            i !== membersList.length - 1 ? ', ' : ''
          }`
        );
      }
    } else if (req.fullText === 'оффлайн') {
      membersList = membersList.filter((m) => !m.profile.online);
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(
          `${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${
            i !== membersList.length - 1 ? ', ' : ''
          }`
        );
      }
    } else if (req.fullText === 'ж') {
      membersList = membersList.filter((m) => m.profile.sex === 1);
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(
          `${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${
            i !== membersList.length - 1 ? ', ' : ''
          }`
        );
      }
    } else if (req.fullText === 'м') {
      membersList = membersList.filter((m) => m.profile.sex === 2);
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(
          `${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${
            i !== membersList.length - 1 ? ', ' : ''
          }`
        );
      }
    } else if (!isNaN(Number(req.text[0])) && Number(req.text[0]) >= 0 && Number(req.text[0]) <= 10 && req.text[1] === 'статус') {
      const users: User[] = await UserModule.find({ status: Number(req.text[0]), chatId: req.msgObject.peerId }, { peerId: 1 });
      membersList = membersList.filter((m) => users.some((u) => m.id === u.peerId));
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(
          `${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${
            i !== membersList.length - 1 ? ', ' : ''
          }`
        );
      }
    } else if (
      /^([0-9]|10)-([0-9]|10)$/.test(req.text[0]) &&
      req.text[1] === 'статусы' &&
      Number(req.text[0].split('-')[0]) < Number(req.text[0].split('-')[1])
    ) {
      const users: User[] = await UserModule.find(
        { status: { $gte: Number(req.text[0].split('-')[0]), $lte: Number(req.text[0].split('-')[1]) }, chatId: req.msgObject.peerId },
        { peerId: 1 }
      );
      membersList = membersList.filter((m) => users.some((u) => m.id === u.peerId));
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(
          `${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${
            i !== membersList.length - 1 ? ', ' : ''
          }`
        );
      }
    } else {
      result = 'Нет такого параметра';
    }
    req.msgObject.send(result).catch(console.error);
  }
};

export const probability = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} вероятность [вопрос]`);
    }
    const data: Antispam = await AntispamModule.findOne({
      chatId: req.chat.chatId,
      command: CommandVkEnum.probability,
      date: moment().startOf('day').toDate(),
      question: req.fullText.toLowerCase()
    });
    let result = `${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}`;
    if (req.user.info?.icon?.length) {
      result = result.concat(` ${req.user.info.icon}`);
    }
    if (data) {
      result = result.concat(`, вероятность составляет ${data.text}%`);
    } else {
      const rand = Math.floor(Math.random() * (100 + 1));
      result = result.concat(`, вероятность составляет ${rand}%`);
      await createAntispam({
        chatId: req.chat.chatId,
        command: CommandVkEnum.probability,
        date: moment().startOf('day').toDate(),
        question: req.fullText.toLowerCase(),
        text: String(rand)
      });
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
};

export const who = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} кто [вопрос]`);
    }
    let result: string;
    if (req.text[0].toLowerCase() === 'я') {
      const adjectives = [
        'Азартный',
        'Безбожный',
        'Ангельский',
        'Безжалостный',
        'Бездушный',
        'Безумный',
        'Великий',
        'Всепоглощающий',
        'Глухой',
        'Головокружительный',
        'Грубый',
        'Добрый',
        'Дикий',
        'Дотошный',
        'Живой',
        'Жгучий',
        'Жуткий',
        'Загадочный',
        'Зевающий',
        'Загробный',
        'Злой',
        'Идеальный',
        'Истреблённый',
        'Кричащий',
        'Крабовый',
        'Красивый',
        'Кровавый',
        'Леденящий',
        'Лютый',
        'Мертвый',
        'Мерцающий',
        'Могучий',
        'Наглый',
        'Напыщенный',
        'Незрелый',
        'Олимпийский',
        'Образцовый',
        'Огромный',
        'Потрясающий',
        'Пламенный',
        'Пьянящий',
        'Радикальный',
        'Ревностный',
        'Седой',
        'Сказочный',
        'Страстный',
        'Твёрдый',
        'Ужасающий',
        'Фантастический',
        'Чёрный',
        'Чёрствый',
        'Экстремальный',
        'Яркий',
        'Яростный',
        'Ядовитый'
      ];
      const nouns = [
        'абрикос',
        'аквариум',
        'барсук',
        'бизнесмен',
        'веган',
        'водитель',
        'гриб',
        'грузчик',
        'десантник',
        'дятел',
        'доктор',
        'ёж',
        'егерь',
        'лебедь',
        'жонглёр',
        'заяц',
        'знахарь',
        'игроман',
        'искатель',
        'аксолотль',
        'клоун',
        'лизун',
        'логопед',
        'манго',
        'майко',
        'окулист',
        'олух',
        'пацифист',
        'пекарь',
        'пацифист',
        'веник',
        'реалист',
        'ректор',
        'садист',
        'мазохист',
        'актив',
        'пассив',
        'сварщик',
        'окунь',
        'тракторист',
        'уж',
        'учитель',
        'философ',
        'фрукт',
        'ягнёнок'
      ];
      const data: Antispam = await AntispamModule.findOne({
        chatId: req.chat.chatId,
        command: CommandVkEnum.who,
        date: moment().startOf('day').toDate(),
        peerId: req.user.id
      });
      result = `${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}`;
      if (req.user.info?.icon?.length) {
        result = result.concat(` ${req.user.info.icon}`);
      }
      if (data) {
        result = result.concat(data.text);
      } else {
        const randText = `, вы - ${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
          nouns[Math.floor(Math.random() * nouns.length)]
        }`;
        result = result.concat(randText);
        await createAntispam({
          chatId: req.chat.chatId,
          command: CommandVkEnum.who,
          date: moment().startOf('day').toDate(),
          peerId: req.user.id,
          text: randText
        });
      }
    } else {
      const membersList = req.members.filter((m) => m.profile);
      const data: Antispam = await AntispamModule.findOne({
        chatId: req.chat.chatId,
        command: CommandVkEnum.who,
        date: moment().startOf('day').toDate(),
        question: req.fullText.toLowerCase()
      });
      result = `${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}`;
      if (req.user.info?.icon?.length) {
        result = result.concat(` ${req.user.info.icon}`);
      }
      if (data) {
        result = result.concat(`, это ${data.text}`);
      } else {
        const rand = Math.floor(Math.random() * membersList.length);
        result = result.concat(`, это ${await stringifyMention({ userId: membersList[rand].id, userInfo: membersList[rand].profile })}`);
        if (membersList[rand].info?.icon?.length) {
          result = result.concat(` ${membersList[rand].info.icon}`);
        }
        await createAntispam({
          chatId: req.chat.chatId,
          command: CommandVkEnum.who,
          date: moment().startOf('day').toDate(),
          question: req.fullText.toLowerCase(),
          text:
            (await stringifyMention({ userId: membersList[rand].id, userInfo: membersList[rand].profile })) +
            (membersList[rand].info?.icon?.length ? ` ${membersList[rand].info.icon}` : '')
        });
      }
    }
    req.msgObject.send(result).catch(console.error);
  }
};

export const activity = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const membersList = req.members.filter((m) => m.profile);
    membersList.sort((a, b) => {
      if (!a.info?.lastActivityDate) {
        return 1;
      }
      if (!b.info?.lastActivityDate) {
        return -1;
      }
      return moment(a.info?.lastActivityDate).unix() > moment(b.info?.lastActivityDate).unix() ? -1 : 1;
    });
    let result = 'Последний актив:';
    for (const member of membersList) {
      result = result.concat(`\n${await stringifyMention({ userId: member.id, userInfo: member.profile })} `);
      if (member.info?.icon?.length) {
        result = result.concat(`${member.info?.icon} `);
      }
      if (member.info?.lastActivityDate) {
        const diff = moment().diff(moment(member.info?.lastActivityDate));
        const days = diff / 1000 / 60 / 60 / 24;
        const hours = (diff / 1000 / 60 / 60) % 24;
        const minutes = (diff / 1000 / 60) % 60;
        if (days >= 1) {
          result = result.concat(`- ${Math.floor(days)} дн. ${Math.floor(hours)} час.`);
        } else if (hours >= 1) {
          result = result.concat(`- ${Math.floor(hours)} час. ${Math.floor(minutes)} мин.`);
        } else if (minutes > 10) {
          result = result.concat(`- ${Math.floor(minutes)} мин.`);
        } else {
          result = result.concat(`- актив`);
        }
      } else {
        result = result.concat(`- неактив`);
      }
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
};

export const getAllNick = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const membersList = req.members.filter((m) => m.profile);
    let result = 'Список ников пользователей:';
    for (const member of membersList) {
      if (member.info?.nick?.length) {
        result = result.concat(`\n${await stringifyMention({ userId: member.id, userInfo: member.profile })} - ${member.info.nick}`);
      }
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
};

export const getAllIcon = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const membersList = req.members.filter((m) => m.profile);
    let result = 'Список значков пользователей:';
    for (const member of membersList) {
      if (member.info?.icon?.length) {
        result = result.concat(`\n${await stringifyMention({ userId: member.id, userInfo: member.profile })} - ${member.info.icon}`);
      }
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
};
