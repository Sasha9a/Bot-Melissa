import { PeerTypeVkEnum } from '@bot-melissa/app/core/enums/peer.type.vk.enum';
import { RequestMessageVkModel } from '@bot-melissa/app/core/models/request.message.vk.model';
import { errorSend, yesSend } from '@bot-melissa/app/core/utils/customMessage.utils.vk';
import { commands } from '@bot-melissa/app/message.vk';
import { checkBanList, createChat, deleteExpiredEvents } from '@bot-melissa/app/module/chat/chat.utils.vk';
import { createCommand } from '@bot-melissa/app/module/status/status.utils.vk';
import { createUser, isOwnerMember, stringifyMention } from '@bot-melissa/app/module/user/user.utils.vk';
import { vk } from '@bot-melissa/app/vk';
import { CommandVkEnum } from '@bot-melissa/shared/enums/command.vk.enum';
import { TypeMarriagesEnum } from '@bot-melissa/shared/enums/type.marriages.enum';
import { Command, CommandModule } from '@bot-melissa/shared/schemas/command.schema';
import { User, UserModule } from '@bot-melissa/shared/schemas/user.schema';
import * as moment from 'moment-timezone';
import { environment } from '../../../environments/environment';

export const updateAll = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const isOwner = await isOwnerMember(req.msgObject.senderId, req.msgObject.peerId);
    if (isOwner) {
      for (const member of req.members) {
        let user: User = await UserModule.findOne({ peerId: member.item.member_id, chatId: req.msgObject.peerId });
        if (!user) {
          user = await createUser({
            chatId: req.msgObject.peerId,
            peerId: member.item.member_id,
            age: member.profile?.bdate ? moment().diff(moment(member.profile.bdate, 'D.M.YYYY'), 'years') : null
          });
        }
        if (member.profile?.bdate && moment().diff(moment(member.profile.bdate, 'D.M.YYYY'), 'years') >= 1) {
          user.age = moment().diff(moment(member.profile.bdate, 'D.M.YYYY'), 'years');
        }
        if (member.item.is_owner) {
          user.status = 10;
        }
        if (!user.joinDate) {
          user.joinDate = new Date(member.item.join_date * 1000);
        }
        if ([3, 4, 5, 8].includes(member.profile?.relation)) {
          user.isBusy = true;
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
        CommandVkEnum.warn,
        CommandVkEnum.warnMinus,
        CommandVkEnum.clearWarnList,
        CommandVkEnum.mute,
        CommandVkEnum.muteMinus,
        CommandVkEnum.clearMuteList,
        CommandVkEnum.settings,
        CommandVkEnum.addEvent,
        CommandVkEnum.deleteEvent
      ];
      for (const comm of commandArray) {
        const command: Command = await CommandModule.findOne({ chatId: req.msgObject.peerId, command: comm });
        if (!command) {
          await createCommand(comm, 10, req.msgObject.peerId);
        }
      }
      if (!req.chat) {
        req.chat = await createChat(req.msgObject.peerId);
      }
      await deleteExpiredEvents(req.chat);
      await yesSend(req.msgObject, `Данные беседы обновлены`);
    }
  }
};

export const setRules = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} новые правила [текст]`);
    }
    req.chat.rules = req.fullText;
    await req.chat.save();
    await yesSend(req.msgObject, `Новые правила установлены`);
  }
};

export const getRules = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.chat.rules) {
      req.msgObject.send(`Текст правил: ${req.chat.rules}`, { disable_mentions: true }).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Нет правил`);
    }
  }
};

export const setGreetings = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} новое приветствие [текст]`);
    }
    req.chat.greetings = req.fullText;
    await req.chat.save();
    await yesSend(req.msgObject, `Новое приветствие установлено`);
  }
};

export const getGreetings = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.chat.greetings) {
      req.msgObject.send(`Текст приветствия: ${req.chat.greetings}`, { disable_mentions: true }).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Нет приветствия`);
    }
  }
};

export const autoKickList = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.chat.autoKickList?.length) {
      let result = 'Список пользователей в автокике:';
      for (const peerId of req.chat.autoKickList) {
        result = result.concat(
          `\n${await stringifyMention({ userId: peerId, userInfo: req.members.find((m) => m.id === peerId)?.profile })}`
        );
      }
      req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Список автокика пустой`);
    }
  }
};

export const banList = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    await checkBanList(req.chat);
    if (req.chat.banList?.length) {
      let result = 'Список пользователей в банлисте:';
      for (const obj of req.chat.banList) {
        result = result.concat(
          `\n${await stringifyMention({ userId: obj.id, userInfo: req.members.find((m) => m.id === obj.id)?.profile })} (до ${moment(
            obj.endDate
          ).format('DD.MM.YYYY HH:mm')})`
        );
      }
      req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Список банлиста пустой`);
    }
  }
};

export const clearBanList = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    req.chat.banList = [];
    await req.chat.save();
    await yesSend(req.msgObject, `Банлист очищен`);
  }
};

export const muteList = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.chat.muteList?.length) {
      let result = 'Список пользователей в муте:';
      for (const obj of req.chat.muteList) {
        result = result.concat(
          `\n${await stringifyMention({ userId: obj.id, userInfo: req.members.find((m) => m.id === obj.id)?.profile })} (до ${moment(
            obj.endDate
          ).format('DD.MM.YYYY HH:mm')})`
        );
      }
      req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
    } else {
      await errorSend(req.msgObject, `Список мута пустой`);
    }
  }
};

export const clearMuteList = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    req.chat.muteList = [];
    await req.chat.save();
    await yesSend(req.msgObject, `Муты очищены`);
  }
};

export const getChat = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const chatInfo = await vk.api.messages.getConversationsById({ peer_ids: req.msgObject.peerId });
    const membersList = req.members.filter((m) => m.profile);
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
    result = result.concat(
      `\n3. Владелец беседы: ${await stringifyMention({
        userId: chatInfo.items[0]?.chat_settings?.owner_id,
        userInfo: membersList.find((m) => m.id === chatInfo.items[0]?.chat_settings?.owner_id)?.profile
      })}`
    );
    result = result.concat(`\n4. Кол-во участников: ${req.members.length}`);
    result = result.concat(
      `\n5. Кол-во девушек в беседе: ${membersList.reduce((count, m) => (m.profile?.sex === 1 ? count + 1 : count), 0)}`
    );
    result = result.concat(
      `\n6. Кол-во мужчин в беседе: ${membersList.reduce((count, m) => (m.profile?.sex === 2 ? count + 1 : count), 0)}`
    );
    result = result.concat(`\n7. Кол-во занятых в беседе: ${membersList.reduce((count, m) => (m.info?.isBusy ? count + 1 : count), 0)}`);
    result = result.concat(`\n8. Кол-во свободных в беседе: ${membersList.reduce((count, m) => (!m.info?.isBusy ? count + 1 : count), 0)}`);
    result = result.concat(`\n9. Макс. кол-во предов: ${req.chat.maxWarn || 0}`);
    result = result.concat(`\n10. Идеология браков: ${textTypeMarriages}`);
    result = result.concat(`\n11. Автокик за неактив: ${req.chat.autoKickInDays > 0 ? req.chat.autoKickInDays + ' дн.' : 'Выключен'}`);
    result = result.concat(`\n12. Автокик по какой статус: ${req.chat.autoKickToStatus ?? '-'}`);
    result = result.concat(`\n13. Статус беседы: ${req.chat.isInvite ? 'Открытая' : 'Закрытая'}`);
    result = result.concat(`\n14. Первое сообщение "О себе": ${req.chat.firstMessageAboutMe ? 'Да' : 'Нет'}`);
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
};

export const onlineList = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const membersList = req.members.filter((m) => m.profile && m.profile.online_info?.is_online);
    console.log(membersList);
    let result = 'Список пользователей онлайн:';
    for (let i = 0; i != membersList.length; i++) {
      result = result.concat(
        `\n${i + 1}. ${await stringifyMention({ userId: membersList[i].id, userInfo: membersList[i].profile })}${
          membersList[i].info?.icon ? ' ' + membersList[i].info?.icon : ''
        }`
      );
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
};

export const help = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Список команд:';
    for (const _comm of commands) {
      if (_comm.command === CommandVkEnum.updateAll) {
        continue;
      }
      result = result.concat(`\n${_comm.command}`);
      if (_comm.argv.length) {
        result = result.concat(` ${_comm.argv}`);
      }
    }
    req.msgObject.send(result).catch(console.error);
  }
};

export const settings = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(
        req.msgObject,
        `Не все параметры введены\n${environment.botName} настройки (номер параметра) (значение)\n` +
          'Номера параметров:\n1. Установить преды\n2. Установить браки\n3. Установить автокик\n' +
          '4. Приватность беседы\n5. Автокик по статус\n6. Первое сообщение "О себе"'
      );
    }
    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 1 || Number(req.text[0]) > 6) {
      return errorSend(req.msgObject, 'Первый аргумент не верный');
    }
    switch (Number(req.text[0])) {
      case 1: {
        if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 1 || Number(req.text[1]) > 10) {
          return errorSend(req.msgObject, 'Второй аргумент не верный (1-10)');
        }
        req.chat.maxWarn = Number(req.text[1]);
        await req.chat.save();
        await yesSend(req.msgObject, `Установлено максимальное количество предов: ${req.chat.maxWarn}`);
        break;
      }
      case 2: {
        if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 0 || Number(req.text[1]) > 3) {
          return errorSend(
            req.msgObject,
            'Второй аргумент не верный (0-3)\n' + '0 - Традиционные\n1 - Многоженство\n2 - Однополые\n3 - Многоженство и однополые'
          );
        }
        req.chat.typeMarriages = Number(req.text[1]);
        await req.chat.save();
        let textTypeMarriages;
        switch (Number(req.text[1])) {
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
        break;
      }
      case 3: {
        if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 0 || Number(req.text[1]) > 90) {
          return errorSend(req.msgObject, 'Второй аргумент не верный (0-90)');
        }
        req.chat.autoKickInDays = Number(req.text[1]);
        await req.chat.save();
        if (Number(req.text[1]) === 0) {
          await yesSend(req.msgObject, `Автокик отключен по активу`);
        } else {
          await yesSend(req.msgObject, `Автокик установлен по неактиву через ${Number(req.text[1])} дн.`);
        }
        break;
      }
      case 4: {
        if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 0 || Number(req.text[1]) > 1) {
          return errorSend(req.msgObject, 'Второй аргумент не верный (0-1)');
        }
        req.chat.isInvite = Number(req.text[1]) === 1;
        await req.chat.save();
        if (!Number(req.text[1])) {
          await yesSend(req.msgObject, `Статус беседы изменен на Закрытую`);
        } else {
          await yesSend(req.msgObject, `Статус беседы изменен на Открытую`);
        }
        break;
      }
      case 5: {
        if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 0 || Number(req.text[1]) > 10) {
          return errorSend(req.msgObject, 'Второй аргумент не верный (0-10)');
        }
        req.chat.autoKickToStatus = Number(req.text[1]);
        await req.chat.save();
        await yesSend(req.msgObject, `Автокик установлен по статус ${Number(req.text[1])} включительно`);
        break;
      }
      case 6: {
        if (isNaN(Number(req.text[1])) || Number(req.text[1]) < 0 || Number(req.text[1]) > 1) {
          return errorSend(req.msgObject, 'Второй аргумент не верный (0-1)');
        }
        req.chat.firstMessageAboutMe = Number(req.text[1]) === 1;
        await req.chat.save();
        if (!Number(req.text[1])) {
          await yesSend(req.msgObject, `Система первого сообщения "О себе" - Отключена`);
        } else {
          await yesSend(req.msgObject, `Система первого сообщения "О себе" - Включена`);
        }
        break;
      }
    }
  }
};
