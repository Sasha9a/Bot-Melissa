import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend, yesSend } from "@bot-sadvers/api/vk/core/utils/customMessage.utils.vk";
import { checkBanList, createChat } from "@bot-sadvers/api/vk/module/chat/chat.utils.vk";
import { createCommand } from "@bot-sadvers/api/vk/module/status/status.utils.vk";
import { createUser, isOwnerMember, stringifyMention } from "@bot-sadvers/api/vk/module/user/user.utils.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { TypeMarriagesEnum } from "@bot-sadvers/shared/enums/type.marriages.enum";
import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";
import { Command, CommandModule } from "@bot-sadvers/shared/schemas/command.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import * as moment from "moment-timezone";
import { MessagesConversationMember, UsersUserFull } from "vk-io/lib/api/schemas/objects";

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
      const commandArray = [
        CommandVkEnum.setCommandStatus,
        CommandVkEnum.updateAll,
        CommandVkEnum.kick,
        CommandVkEnum.autoKick,
        CommandVkEnum.autoKickMinus,
        CommandVkEnum.ban,
        CommandVkEnum.banMinus,
        CommandVkEnum.clearBanList,
        CommandVkEnum.setMaxWarn,
        CommandVkEnum.warn,
        CommandVkEnum.warnMinus,
        CommandVkEnum.clearWarnList,
        CommandVkEnum.mute,
        CommandVkEnum.muteMinus,
        CommandVkEnum.clearMuteList,
        CommandVkEnum.setMarriages,
        CommandVkEnum.setAutoKickInDays,
        CommandVkEnum.statusChat
      ];
      for (const comm of commandArray) {
        const command: Command = await CommandModule.findOne({ chatId: req.msgObject.peerId, command: comm });
        if (!command) {
          await createCommand(comm, 10, req.msgObject.peerId);
        }
      }
      const chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
      if (!chat) {
        await createChat(req.msgObject.peerId);
      }
      await yesSend(req.msgObject, `Данные беседы обновлены`);
    }
  }
}

export async function setRules(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nНовые правила [текст]');
    }
    req.chat.rules = req.fullText;
    await req.chat.save();
    await yesSend(req.msgObject, `Новые правила установлены`);
  }
}

export async function getRules(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.chat.rules) {
      req.msgObject.send(`Текст правил: ${req.chat.rules}`).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Нет правил`);
    }
  }
}

export async function setGreetings(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nНовое приветствие [текст]');
    }
    req.chat.greetings = req.fullText;
    await req.chat.save();
    await yesSend(req.msgObject, `Новое приветствие установлено`);
  }
}

export async function getGreetings(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.chat.greetings) {
      req.msgObject.send(`Текст приветствия: ${req.chat.greetings}`).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Нет приветствия`);
    }
  }
}

export async function autoKickList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.chat.autoKickList?.length) {
      let result = 'Список пользователей в автокике:';
      for (const peerId of req.chat.autoKickList) {
        result = result.concat(`\n${await stringifyMention(peerId)}`);
      }
      req.msgObject.send(result).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Список автокика пустой`);
    }
  }
}

export async function banList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    await checkBanList(req.chat);
    if (req.chat.banList?.length) {
      let result = 'Список пользователей в банлисте:';
      for (const obj of req.chat.banList) {
        result = result.concat(`\n${await stringifyMention(obj.id)} (до ${moment(obj.endDate).format('DD.MM.YYYY HH:mm')})`);
      }
      req.msgObject.send(result).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Список банлиста пустой`);
    }
  }
}

export async function clearBanList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    req.chat.banList = [];
    await req.chat.save();
    await yesSend(req.msgObject, `Банлист очищен`);
  }
}

export async function setMaxWarn(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nУстановить пред [количество]');
    }
    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 1 || Number(req.text[0]) > 10) {
      return errorSend(req.msgObject, 'Первый аргумент не верный (1-10)');
    }
    req.chat.maxWarn = Number(req.text[0]);
    await req.chat.save();
    await yesSend(req.msgObject, `Установлено максимальное количество предов: ${req.chat.maxWarn}`);
  }
}

export async function muteList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.chat.muteList?.length) {
      let result = 'Список пользователей в муте:';
      for (const obj of req.chat.muteList) {
        result = result.concat(`\n${await stringifyMention(obj.id)} (до ${moment(obj.endDate).format('DD.MM.YYYY HH:mm')})`);
      }
      req.msgObject.send(result).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Список мута пустой`);
    }
  }
}

export async function clearMuteList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    req.chat.muteList = [];
    await req.chat.save();
    await yesSend(req.msgObject, `Муты очищены`);
  }
}

export async function setMarriages(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nУстановить браки [номер параметра]\n' +
        '0 - Традиционные\n1 - Многоженство\n2 - Однополые\n3 - Многоженство и однополые');
    }
    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 0 || Number(req.text[0]) > 3) {
      return errorSend(req.msgObject, 'Первый аргумент не верный (0-3)');
    }
    req.chat.typeMarriages = Number(req.text[0]);
    await req.chat.save();
    let textTypeMarriages;
    switch (Number(req.text[0])) {
      case TypeMarriagesEnum.traditional: {
        textTypeMarriages = 'Традиционные';
        break;
      }
      case TypeMarriagesEnum.polygamy: {
        textTypeMarriages = 'Многоженство';
        break;
      }
      case TypeMarriagesEnum.sameSex: {
        textTypeMarriages = 'Однополые';
        break;
      }
      case TypeMarriagesEnum.polygamyAndSameSex: {
        textTypeMarriages = 'Многоженство и однополые';
        break;
      }
    }
    await yesSend(req.msgObject, `В беседе установлена идеология браков: ${textTypeMarriages}`);
  }
}

export async function setAutoKickInDays(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nУстановить автокик [кол-во дней]');
    }
    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 0 || Number(req.text[0]) > 90) {
      return errorSend(req.msgObject, 'Первый аргумент не верный (0-90)');
    }
    req.chat.autoKickInDays = Number(req.text[0]);
    await req.chat.save();
    if (Number(req.text[0]) === 0) {
      await yesSend(req.msgObject, `Автокик отключен по активу`);
    } else {
      await yesSend(req.msgObject, `Автокик установлен по неактиву через ${Number(req.text[0])} дн.`);
    }
  }
}

export async function getChat(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const chatInfo = await vk.api.messages.getConversationsById({ peer_ids: req.msgObject.peerId });
    const members = await vk.api.messages.getConversationMembers({ peer_id: req.msgObject.peerId });
    let membersList: { id: number, item: MessagesConversationMember, profile: UsersUserFull }[] = [];
    for (const member of members.items) {
      membersList.push({
        id: member.member_id,
        item: member,
        profile: members.profiles.find((profile) => profile.id === member.member_id)
      });
    }
    membersList = membersList.filter((m) => m.profile);
    let textTypeMarriages;
    switch (req.chat.typeMarriages) {
      case TypeMarriagesEnum.traditional: {
        textTypeMarriages = 'Традиционные';
        break;
      }
      case TypeMarriagesEnum.polygamy: {
        textTypeMarriages = 'Многоженство';
        break;
      }
      case TypeMarriagesEnum.sameSex: {
        textTypeMarriages = 'Однополые';
        break;
      }
      case TypeMarriagesEnum.polygamyAndSameSex: {
        textTypeMarriages = 'Многоженство и однополые';
        break;
      }
    }
    let result = 'Информация о беседе:';
    result = result.concat(`\n1. Номер беседы: ${req.chat.chatId}`);
    result = result.concat(`\n2. Название беседы: ${chatInfo.items[0]?.chat_settings?.title || '-'}`);
    result = result.concat(`\n3. Владелец беседы: ${await stringifyMention(chatInfo.items[0]?.chat_settings?.owner_id)}`);
    result = result.concat(`\n4. Кол-во участников: ${members.count}`);
    result = result.concat(`\n5. Кол-во девушек в беседе: ${membersList.reduce((count, m) => m.profile?.sex === 1 ? count + 1 : count, 0)}`);
    result = result.concat(`\n6. Кол-во мужчин в беседе: ${membersList.reduce((count, m) => m.profile?.sex === 2 ? count + 1 : count, 0)}`);
    result = result.concat(`\n7. Макс. кол-во предов: ${req.chat.maxWarn || 0}`);
    result = result.concat(`\n8. Идеология браков: ${textTypeMarriages}`);
    result = result.concat(`\n9. Автокик за неактив: ${req.chat.autoKickInDays > 0 ? (req.chat.autoKickInDays + ' дн.') : 'Выключен'}`);
    result = result.concat(`\n10. Статус беседы: ${req.chat.isInvite ? 'Открытая' : 'Закрытая'}`);
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
}

export async function statusChat(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nСтатус беседы [параметр]\n1 - Открытая\n0 - Закрытая');
    }
    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 0 || Number(req.text[0]) > 1) {
      return errorSend(req.msgObject, 'Первый аргумент не верный (0-1)');
    }
    req.chat.isInvite = req.text[0] === '1';
    await req.chat.save();
    if (Number(req.text[0]) === 0) {
      await yesSend(req.msgObject, `Статус беседы изменен на Закрытую`);
    } else {
      await yesSend(req.msgObject, `Статус беседы изменен на Открытую`);
    }
  }
}
