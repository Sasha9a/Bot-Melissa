import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend, yesSend } from "@bot-sadvers/api/vk/core/utils/customMessage.utils.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import { getFullUserInfo, isOwnerMember, stringifyMention, templateGetUser } from "./user.utils.vk";
import * as moment from "moment-timezone";

export async function setNickMe(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return errorSend(req.msgObject, 'Вы не ввели ник');
    }
    req.user.info.nick = req.fullText;
    await req.user.info.save();
    await yesSend(req.msgObject, `Установлен ник для ${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}: "${req.fullText}"`);
  }
}

export async function setNick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nНик [пользователь] [ник]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    user.nick = req.fullText.substring(req.fullText.indexOf(req.text[1]));
    await user.save();
    await yesSend(req.msgObject, `Установлен ник для ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })}: "${user.nick}"`);
  }
}

export async function setIconMe(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (!req.text.length) {
      return errorSend(req.msgObject, 'Вы не ввели значок');
    }
    req.user.info.icon = req.fullText;
    await req.user.info.save();
    await yesSend(req.msgObject, `Установлен значок для ${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}: "${req.fullText}"`);
  }
}

export async function setIcon(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nЗначок [пользователь] [значок]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    user.icon = req.fullText.substring(req.fullText.indexOf(req.text[1]));
    await user.save();
    await yesSend(req.msgObject, `Установлен значок для ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })}: "${user.icon}"`);
  }
}

export async function getUser(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length > 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nУчастник [пользователь]');
    }
    if (req.text.length === 1) {
      const user: User = await getFullUserInfo(req.text[0], req.msgObject);
      if (!user) {
        return ;
      }
      req.msgObject.send(await templateGetUser(req, user.peerId), { disable_mentions: true }).catch(console.error);
    } else {
      req.msgObject.send(await templateGetUser(req, req.user.id), { disable_mentions: true }).catch(console.error);
    }
  }
}

export async function setStatus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nСтатус [пользователь] [номер статуса]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 0 || Number(req.text[1]) > 10) {
      return errorSend(req.msgObject, 'Второй аргумент не верный');
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя менять статус создателю беседы');
    }
    if ((req.user.info.status <= Number(req.text[1]) && !await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))
      || (req.user.info.status <= user.status && !await isOwnerMember(req.user.info.peerId, req.msgObject.peerId))) {
      return errorSend(req.msgObject, 'Нет прав для выдачи такого статуса');
    }
    user.status = Number(req.text[1]);
    await user.save();
    await yesSend(req.msgObject, `Установлен статус ${req.text[1]} для ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })}`);
  }
}

export async function getStatuses(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Статус пользователей:';
    const users: User[] = await UserModule.find({ status: { $ne: 0 }, chatId: req.msgObject.peerId }, { status: 1, peerId: 1 });
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
          result = result.concat(`\n${await stringifyMention({ userId: u.peerId, userInfo: req.members.find((m) => m.id === u.peerId)?.profile })}`);
        }
      }
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
}

export async function kick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nКик [пользователь]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (req.user.info.status <= user.status && !await isOwnerMember(req.user.info.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для кика');
    }
    await vk.api.messages.removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId }).then(async () => {
      await yesSend(req.msgObject, `${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} исключен из беседы`);
    }).catch(console.error);
  }
}

export async function autoKick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nАвтокик [пользователь]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (req.user.info.status <= user.status && !await isOwnerMember(req.user.info.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для автокика');
    }
    await vk.api.messages.removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId, user_id: user.peerId }).catch(console.error);
    if (!req.chat.autoKickList) {
      req.chat.autoKickList = [];
    }
    if (req.chat.autoKickList.findIndex((u) => u === user.peerId) !== -1) {
      return errorSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} уже в автокике`);
    }
    req.chat.autoKickList.push(user.peerId);
    await req.chat.save();
    await yesSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} добавлен в автокик`);
  }
}

export async function autoKickMinus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nАвтокик- [пользователь]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (!req.chat.autoKickList) {
      req.chat.autoKickList = [];
    }
    if (req.chat.autoKickList.findIndex((id) => id === user.peerId) !== -1) {
      req.chat.autoKickList = req.chat.autoKickList.filter((id) => id !== user.peerId);
      await req.chat.save();
      await yesSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} удален из автокика`);
    } else {
      await errorSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} не находится в списке автокика`);
    }
  }
}

export async function ban(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nБан [пользователь] [кол-во дней]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 1 || Number(req.text[1]) > 90) {
      return errorSend(req.msgObject, 'Второй аргумент не верный (1-90 дней)');
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя кикнуть создателя беседы');
    }
    if (req.user.info.status <= user.status && !await isOwnerMember(req.user.info.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для бана');
    }
    await vk.api.messages.removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId, user_id: user.peerId }).catch(console.error);
    if (!req.chat.banList) {
      req.chat.banList = [];
    }
    if (req.chat.banList.findIndex((u) => u.id === user.peerId) !== -1) {
      return errorSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} уже в банлисте`);
    }
    req.chat.banList.push({
      id: user.peerId,
      endDate: moment().add(Number(req.text[1]), 'days').toDate()
    });
    req.chat.markModified('banList');
    await req.chat.save();
    await yesSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} добавлен в банлист на ${Number(req.text[1])} дн.`);
  }
}

export async function banMinus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nБан- [пользователь]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (!req.chat.banList) {
      req.chat.banList = [];
    }
    if (req.chat.banList.findIndex((u) => u.id === user.peerId) !== -1) {
      req.chat.banList = req.chat.banList.filter((u) => u.id !== user.peerId);
      req.chat.markModified('banList');
      await req.chat.save();
      await yesSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} удален из банлиста`);
    } else {
      await errorSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} не находится в списке банлиста`);
    }
  }
}

export async function warn(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nПред [пользователь] [кол-во]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 1) {
      return errorSend(req.msgObject, `Второй аргумент не верный`);
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя наказать создателя беседы');
    }
    if (req.user.info.status <= user.status && !await isOwnerMember(req.user.info.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для наказания');
    }
    if (user.warn + Number(req.text[1]) >= req.chat.maxWarn) {
      user.warn = 0;
      await user.save();
      await vk.api.messages.removeChatUser({ chat_id: req.msgObject.peerId - 2000000000, member_id: user.peerId, user_id: user.peerId }).then(async () => {
        await yesSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} был кикнут по достижению лимита кол-ва предупреждений`);
      }).catch(console.error);
    } else {
      user.warn += Number(req.text[1]);
      await user.save();
      await yesSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} получает предупреждение в количестве: ${Number(req.text[1])} шт.`);
    }
  }
}

export async function warnMinus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nСнять пред [пользователь] [кол-во]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 1) {
      return errorSend(req.msgObject, `Второй аргумент не верный`);
    }
    if (req.user.info.status <= user.status && !await isOwnerMember(req.user.info.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для снятия наказания');
    }
    if (user.warn === 0) {
      return errorSend(req.msgObject, `У пользователя ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} нет предупреждений`);
    }
    if (user.warn - Number(req.text[1]) < 0) {
      user.warn = 0;
    } else {
      user.warn -= Number(req.text[1]);
    }
    await user.save();
    await yesSend(req.msgObject, `Пользователю ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} сняли предупреждение в количестве: ${Number(req.text[1])} шт.`);
  }
}

export async function warnList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Список пользователей с предом:';
    const users: User[] = await UserModule.find({ warn: { $ne: 0 }, chatId: req.msgObject.peerId });
    if (!users.length) {
      req.msgObject.send(`Список пользователей с предом пустой`).catch(console.error);
    } else {
      for (const user of users) {
        result = result.concat(`\n${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })}: ${user.warn} / ${req.chat.maxWarn}`);
      }
      req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
    }
  }
}

export async function clearWarnList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    await UserModule.updateMany({ warn: { $ne: 0 }, chatId: req.msgObject.peerId }, { warn: 0 });
    req.msgObject.send(`Список пользователей с предом очищен`).catch(console.error);
  }
}

export async function mute(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nМут [пользователь] [кол-во часов]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 1 || Number(req.text[1]) > 96) {
      return errorSend(req.msgObject, 'Второй аргумент не верный (1-96 часов)');
    }
    if (await isOwnerMember(user.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нельзя выдать мут создателю беседы');
    }
    if (req.user.info.status <= user.status && !await isOwnerMember(req.user.info.peerId, req.msgObject.peerId)) {
      return errorSend(req.msgObject, 'Нет прав для мута');
    }
    if (!req.chat.muteList) {
      req.chat.muteList = [];
    }
    if (req.chat.muteList.findIndex((u) => u.id === user.peerId) !== -1) {
      return errorSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} уже в муте`);
    }
    req.chat.muteList.push({
      id: user.peerId,
      endDate: moment().add(Number(req.text[1]), 'hours').toDate()
    });
    req.chat.markModified('muteList');
    await req.chat.save();
    await yesSend(req.msgObject, `Пользователь ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} получает мут на ${Number(req.text[1])} ч.`);
  }
}

export async function muteMinus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nМут- [пользователь]');
    }
    const user: User = await getFullUserInfo(req.text[0], req.msgObject);
    if (!user) {
      return ;
    }
    if (!req.chat.muteList) {
      req.chat.muteList = [];
    }
    if (req.chat.muteList.findIndex((u) => u.id === user.peerId) !== -1) {
      req.chat.muteList = req.chat.muteList.filter((u) => u.id !== user.peerId);
      req.chat.markModified('muteList');
      await req.chat.save();
      await yesSend(req.msgObject, `Пользователю ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} сняли мут`);
    } else {
      await errorSend(req.msgObject, `У пользователя ${await stringifyMention({ userId: user.peerId, userInfo: req.members.find((m) => m.id === user.peerId)?.profile })} нет мута`);
    }
  }
}

export async function convene(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nСозвать [параметр]');
    }
    let membersList = req.members.filter((m) => m.id !== req.msgObject.senderId && m.profile);
    let result = '';
    if (req.fullText === 'всех') {
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(`${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${i !== membersList.length - 1 ? ', ' : ''}`);
      }
    } else if (req.fullText === 'онлайн') {
      membersList = membersList.filter((m) => m.profile.online);
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(`${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${i !== membersList.length - 1 ? ', ' : ''}`);
      }
    } else if (req.fullText === 'оффлайн') {
      membersList = membersList.filter((m) => !m.profile.online);
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(`${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${i !== membersList.length - 1 ? ', ' : ''}`);
      }
    } else if (req.fullText === 'ж') {
      membersList = membersList.filter((m) => m.profile.sex === 1);
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(`${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${i !== membersList.length - 1 ? ', ' : ''}`);
      }
    } else if (req.fullText === 'м') {
      membersList = membersList.filter((m) => m.profile.sex === 2);
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(`${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${i !== membersList.length - 1 ? ', ' : ''}`);
      }
    } else if (!isNaN(Number(req.text[0])) && Number(req.text[0]) >= 0 && Number(req.text[0]) <= 10 && req.text[1] === 'статус') {
      const users: User[] = await UserModule.find({ status: Number(req.text[0]), chatId: req.msgObject.peerId }, { peerId: 1 });
      membersList = membersList.filter((m) => users.some((u) => m.id === u.peerId));
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(`${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${i !== membersList.length - 1 ? ', ' : ''}`);
      }
    } else if (/^([0-9]|10)-([0-9]|10)$/.test(req.text[0]) && req.text[1] === 'статусы'
      && Number(req.text[0].split('-')[0]) < Number(req.text[0].split('-')[1])) {
      const users: User[] = await UserModule.find({ status: { $gte: Number(req.text[0].split('-')[0]), $lte: Number(req.text[0].split('-')[1]) }, chatId: req.msgObject.peerId }, { peerId: 1 });
      membersList = membersList.filter((m) => users.some((u) => m.id === u.peerId));
      for (let i = 0; i != membersList.length; i++) {
        result = result.concat(`${await stringifyMention({ userId: membersList[i].item.member_id, userInfo: membersList[i].profile })}${i !== membersList.length - 1 ? ', ' : ''}`);
      }
    } else {
      result = 'Нет такого параметра';
    }
    req.msgObject.send(result).catch(console.error);
  }
}

export async function probability(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nВероятность [вопрос]');
    }
    req.msgObject.send(`${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}, вероятность составляет ${Math.floor(Math.random() * (100 + 1))}%`, { disable_mentions: true }).catch(console.error);
  }
}

export async function who(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nКто [вопрос]');
    }
    let result: string;
    if (req.text[0].toLowerCase() === 'я') {
      const adjectives = [
        'Азартный', 'Безбожный', 'Ангельский', 'Безжалостный', 'Бездушный',
        'Безумный', 'Великий', 'Всепоглощающий', 'Глухой', 'Головокружительный',
        'Грубый', 'Добрый', 'Дикий', 'Дотошный', 'Живой',
        'Жгучий', 'Жуткий', 'Загадочный', 'Зевающий', 'Загробный',
        'Злой', 'Идеальный', 'Истреблённый', 'Кричащий', 'Крабовый',
        'Красивый', 'Кровавый', 'Леденящий', 'Лютый', 'Мертвый',
        'Мерцающий', 'Могучий', 'Наглый', 'Напыщенный', 'Незрелый',
        'Олимпийский', 'Образцовый', 'Огромный', 'Потрясающий', 'Пламенный',
        'Пьянящий', 'Радикальный', 'Ревностный', 'Седой', 'Сказочный',
        'Страстный', 'Твёрдый', 'Ужасающий', 'Фантастический', 'Чёрный',
        'Чёрствый', 'Экстремальный', 'Яркий', 'Яростный', 'Ядовитый'
      ];
      const nouns = [
        'абрикос', 'аквариум', 'барсук', 'бизнесмен', 'выдра',
        'водитель', 'гриб', 'грузчик', 'дерево', 'дятел',
        'доктор', 'ёж', 'егерь', 'жаба', 'жонглёр',
        'заяц', 'знахарь', 'икра', 'искатель', 'килька',
        'клоун', 'лизун', 'логопед', 'манго', 'майко',
        'окулист', 'олух', 'пацифист', 'пекарь', 'бревно',
        'веник', 'редька', 'ректор', 'садист', 'мазохист',
        'актив', 'пассив', 'сварщик', 'селёдка', 'тракторист',
        'уж', 'учитель', 'фантазёр', 'черешня', 'язва'
      ];
      result = `${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}, вы - `;
      result = result.concat(`${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`);
    } else {
      const membersList = req.members.filter((m) => m.profile);
      const rand = Math.floor(Math.random() * membersList.length);
      result = `${await stringifyMention({ userId: req.user.info.peerId, userInfo: req.user.profile })}, это `;
      result = result.concat(await stringifyMention({ userId: membersList[rand].id, userInfo: membersList[rand].profile }));
    }
    req.msgObject.send(result).catch(console.error);
  }
}

export async function activity(req: RequestMessageVkModel) {
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
      if (member.info?.lastActivityDate) {
        const days = moment().diff(moment(member.info?.lastActivityDate)) / 1000 / 60 / 60 / 24;
        const hours = moment().diff(moment(member.info?.lastActivityDate)) / 1000 / 60 / 60 % 24;
        const minutes = moment().diff(moment(member.info?.lastActivityDate)) / 1000 / 60 % 60;
        if (days >= 1) {
          result = result.concat(`\n${await stringifyMention({ userId: member.id, userInfo: member.profile })} - ${days.toFixed()} дн. ${hours.toFixed()} час.`);
        } else if (hours >= 1) {
          result = result.concat(`\n${await stringifyMention({ userId: member.id, userInfo: member.profile })} - ${hours.toFixed()} час. ${minutes.toFixed()} мин.`);
        } else if (minutes > 10) {
          result = result.concat(`\n${await stringifyMention({ userId: member.id, userInfo: member.profile })} - ${minutes.toFixed()} мин.`);
        } else {
          result = result.concat(`\n${await stringifyMention({ userId: member.id, userInfo: member.profile })} - актив`);
        }
      } else {
        result = result.concat(`\n${await stringifyMention({ userId: member.id, userInfo: member.profile })} - неактив`);
      }
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
}
