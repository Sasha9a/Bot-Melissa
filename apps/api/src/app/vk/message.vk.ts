import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/customMessage.utils.vk";
import { checkBanList, checkMuteList, deleteAntispam } from "@bot-sadvers/api/vk/module/chat/chat.utils.vk";
import {
  autoKickList,
  banList,
  clearBanList,
  clearMuteList,
  getChat,
  getGreetings,
  getRules,
  help,
  muteList,
  onlineList,
  setGreetings,
  setRules, settings,
  updateAll
} from "@bot-sadvers/api/vk/module/chat/chat.vk";
import { checkTimeMarriage } from "@bot-sadvers/api/vk/module/marriage/marriage.utils.vk";
import { divorce, marriage, marriages } from "@bot-sadvers/api/vk/module/marriage/marriage.vk";
import { accessCheck } from "@bot-sadvers/api/vk/module/status/status.utils.vk";
import { getCommandsStatus, setCommandStatus, setNameStatus } from "@bot-sadvers/api/vk/module/status/status.vk";
import { autoKickInDays, isOwnerMember, stringifyMention, updateLastActivityUser } from "@bot-sadvers/api/vk/module/user/user.utils.vk";
import {
  activity,
  autoKick,
  autoKickMinus,
  ban,
  banMinus,
  clearWarnList,
  convene,
  getStatuses,
  getUser,
  kick,
  mute,
  muteMinus,
  probability,
  setIcon,
  setIconMe,
  setNick,
  setNickMe,
  setStatus,
  warn,
  warnList,
  warnMinus,
  who
} from "@bot-sadvers/api/vk/module/user/user.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";
import { Marriage, MarriageModule } from "@bot-sadvers/shared/schemas/marriage.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import * as moment from "moment-timezone";
import { ContextDefaultState, Keyboard, MessageContext, MessageEventContext } from "vk-io";
import { MessagesConversationMember, UsersUserFull } from "vk-io/lib/api/schemas/objects";
import { environment } from "../../environments/environment";

const nameBot = 'лиса';

export const commands: { command: CommandVkEnum, func: (req: RequestMessageVkModel) => Promise<any>, argv: string }[] = [
  { command: CommandVkEnum.updateAll, func: updateAll, argv: '' },
  { command: CommandVkEnum.getUser, func: getUser, argv: '[пользователь]' },
  { command: CommandVkEnum.setNickMe, func: setNickMe, argv: '' },
  { command: CommandVkEnum.setNick, func: setNick, argv: '(пользователь) (ник)' },
  { command: CommandVkEnum.setIconMe, func: setIconMe, argv: '' },
  { command: CommandVkEnum.setIcon, func: setIcon, argv: '(пользователь) (значок)' },
  { command: CommandVkEnum.setStatus, func: setStatus, argv: '(пользователь) (номер статуса)' },
  { command: CommandVkEnum.getStatuses, func: getStatuses, argv: '' },
  { command: CommandVkEnum.setNameStatus, func: setNameStatus, argv: '(номер статуса) (название)' },
  { command: CommandVkEnum.setCommandStatus, func: setCommandStatus, argv: '(номер статуса) (команда)' },
  { command: CommandVkEnum.getCommandsStatus, func: getCommandsStatus, argv: '' },
  { command: CommandVkEnum.setRules, func: setRules, argv: '(текст)' },
  { command: CommandVkEnum.getRules, func: getRules, argv: '' },
  { command: CommandVkEnum.setGreetings, func: setGreetings, argv: '(текст)' },
  { command: CommandVkEnum.getGreetings, func: getGreetings, argv: '' },
  { command: CommandVkEnum.kick, func: kick, argv: '(пользователь)' },
  { command: CommandVkEnum.autoKick, func: autoKick, argv: '(пользователь)' },
  { command: CommandVkEnum.autoKickMinus, func: autoKickMinus, argv: '(пользователь)' },
  { command: CommandVkEnum.autoKickList, func: autoKickList, argv: '' },
  { command: CommandVkEnum.ban, func: ban, argv: '(пользователь) (количество дней)' },
  { command: CommandVkEnum.banMinus, func: banMinus, argv: '(пользователь)' },
  { command: CommandVkEnum.banList, func: banList, argv: '' },
  { command: CommandVkEnum.clearBanList, func: clearBanList, argv: '' },
  { command: CommandVkEnum.warn, func: warn, argv: '(пользователь) (количество)' },
  { command: CommandVkEnum.warnMinus, func: warnMinus, argv: '(пользователь) (количество)' },
  { command: CommandVkEnum.warnList, func: warnList, argv: '' },
  { command: CommandVkEnum.clearWarnList, func: clearWarnList, argv: '' },
  { command: CommandVkEnum.mute, func: mute, argv: '(пользователь) (количество часов)' },
  { command: CommandVkEnum.muteMinus, func: muteMinus, argv: '(пользователь)' },
  { command: CommandVkEnum.muteList, func: muteList, argv: '' },
  { command: CommandVkEnum.clearMuteList, func: clearMuteList, argv: '' },
  { command: CommandVkEnum.convene, func: convene, argv: '(параметр)' },
  { command: CommandVkEnum.marriage, func: marriage, argv: '(пользователь)' },
  { command: CommandVkEnum.marriages, func: marriages, argv: '' },
  { command: CommandVkEnum.divorce, func: divorce, argv: '(пользователь)' },
  { command: CommandVkEnum.probability, func: probability, argv: '(вопрос)' },
  { command: CommandVkEnum.who, func: who, argv: '(вопрос)' },
  { command: CommandVkEnum.activity, func: activity, argv: '' },
  { command: CommandVkEnum.getChat, func: getChat, argv: '' },
  { command: CommandVkEnum.onlineList, func: onlineList, argv: '' },
  { command: CommandVkEnum.help, func: help, argv: '' },
  { command: CommandVkEnum.settings, func: settings, argv: '(номер параметра) (значение)' }
];

export async function parseMessage(message: MessageContext<ContextDefaultState>) {
  const chat: Chat = await ChatModule.findOne({ chatId: message.peerId });
  const members = await vk.api.messages.getConversationMembers({ peer_id: message.peerId });
  const users: User[] = await UserModule.find({ chatId: message.peerId });
  const membersList: { id: number, item: MessagesConversationMember, profile: UsersUserFull, info: User }[] = [];
  for (const member of members.items) {
    membersList.push({
      id: member.member_id,
      item: member,
      profile: members.profiles.find((profile) => profile.id === member.member_id),
      info: users.find((u) => u.peerId === member.member_id)
    });
  }
  await checkMuteList(chat);
  await deleteAntispam(chat);
  if (chat && chat.muteList?.findIndex((u) => u.id === message.senderId) !== -1) {
    await vk.api.messages.delete({ cmids: message.conversationMessageId, delete_for_all: true, peer_id: message.peerId }).catch(console.error);
    return;
  }
  await updateLastActivityUser(message);
  await autoKickInDays(chat, message, membersList);
  await checkTimeMarriage(chat, membersList, message);
  if (message.text?.toLowerCase().startsWith(nameBot) && message.text[nameBot.length] === ' ') {
    message.text = message.text.substring(nameBot.length + 1);
    if (!chat && !(message.text?.toLowerCase().startsWith(CommandVkEnum.updateAll) && (!message.text[CommandVkEnum.updateAll.length] || message.text[CommandVkEnum.updateAll.length] === ' '))) {
      return errorSend(message, `Произошла ошибка. Владелец беседы, введи: Обновить`);
    }
    const request: RequestMessageVkModel = new RequestMessageVkModel();
    request.chat = chat;
    request.members = membersList;
    for (const command of commands) {
      if (message.text?.toLowerCase().startsWith(command.command) && (!message.text[command.command.length] || message.text[command.command.length] === ' ')) {
        const currentUser = request.members.find((m) => m.id === message.senderId);
        if (!currentUser?.info && !(message.text?.toLowerCase().startsWith(CommandVkEnum.updateAll) && (!message.text[CommandVkEnum.updateAll.length] || message.text[CommandVkEnum.updateAll.length] === ' '))) {
          return errorSend(message, `Произошла ошибка. Владелец беседы, введи: Обновить`);
        }
        if (await accessCheck(currentUser?.info, command.command, message.peerId)) {
          request.command = command.command;
          request.fullText = message.text.substring(message.text.indexOf(command.command) + command.command.length + 1);
          request.text = request.fullText.length ? request.fullText.split(' ') : [];
          request.msgObject = message;
          request.user = currentUser;
          command.func(request).catch(console.error);
        } else {
          await errorSend(message, 'Нет доступа');
        }
        break;
      }
    }
  }
}

export async function inviteUser(message: MessageContext<ContextDefaultState>) {
  if (message.eventMemberId === -environment.groupId) {
    await message.send('Добрый день всем! Я бот администратор :)\nЧтобы я заработал, выдайте мне админку и Владелец беседы введи команду: "Обновить"').catch(console.error);
  } else {
    const chat: Chat = await ChatModule.findOne({ chatId: message.peerId });
    if (!chat) {
      return errorSend(message, `Произошла ошибка. Владелец беседы, введи: Обновить`);
    }
    await checkBanList(chat);
    if (!chat.isInvite && !await isOwnerMember(message.senderId, message.peerId)) {
      await vk.api.messages.removeChatUser({ chat_id: message.peerId - 2000000000, member_id: message.eventMemberId, user_id: message.eventMemberId }).catch(console.error);
      return ;
    }
    if (chat.autoKickList && chat.autoKickList.findIndex((id) => id === message.eventMemberId) !== -1) {
      await vk.api.messages.removeChatUser({ chat_id: message.peerId - 2000000000, member_id: message.eventMemberId, user_id: message.eventMemberId }).catch(console.error);
      await message.send(`Пользователь ${await stringifyMention({ userId: message.eventMemberId })} находится в списке автокика`).catch(console.error);
      return;
    }
    if (chat.banList && chat.banList.findIndex((u) => u.id === message.eventMemberId) !== -1) {
      await vk.api.messages.removeChatUser({ chat_id: message.peerId - 2000000000, member_id: message.eventMemberId, user_id: message.eventMemberId }).catch(console.error);
      await message.send(`Пользователь ${await stringifyMention({ userId: message.eventMemberId })} находится в списке банлиста`).catch(console.error);
      return;
    }
    let user: User = await UserModule.findOne({ peerId: message.eventMemberId, chatId: message.peerId });
    if (!user) {
      user = new UserModule({
        peerId: message.eventMemberId,
        chatId: message.peerId,
        status: 0
      });
      return await user.save();
    }
    if (chat.greetings) {
      let result = `${await stringifyMention({ userId: message.eventMemberId })}, ${chat.greetings}`;
      if (chat.rules) {
        result = result.concat(`\n\n${chat.rules}`);
      }
      await message.send(result).catch(console.error);
    }
  }
}

export async function kickUser(message: MessageContext<ContextDefaultState>) {
  if (!await isOwnerMember(message.eventMemberId, message.peerId)) {
    await vk.api.messages.removeChatUser({ chat_id: message.peerId - 2000000000, member_id: message.eventMemberId, user_id: message.eventMemberId }).catch(console.error);
  }
}

export async function messageEvent(message: MessageEventContext) {
  if (message.eventPayload?.command == CommandVkEnum.marriage) {
    if (message.eventPayload?.userId === message.userId) {
      const marriage: Marriage = await MarriageModule.findOne({ chatId: message.peerId, $or: [ {userFirstId: message.eventPayload?.userFromId, userSecondId: message.eventPayload?.userId}, {userFirstId: message.eventPayload?.userId, userSecondId: message.eventPayload?.userFromId} ] });
      if (marriage && message.eventPayload?.status === 0 && !marriage.isConfirmed) {
        await MarriageModule.deleteOne({ chatId: message.peerId, $or: [ {userFirstId: message.eventPayload?.userFromId, userSecondId: message.eventPayload?.userId}, {userFirstId: message.eventPayload?.userId, userSecondId: message.eventPayload?.userFromId} ] });
        await vk.api.messages.send({
          peer_id: message.peerId,
          random_id: moment().unix(),
          message: `${await stringifyMention({ userId: message.eventPayload?.userFromId })} увы, но ${await stringifyMention({ userId: message.userId })} отказался(-ась) от предложения вступление в брак`
        }).catch(console.error);
      }
      if (marriage && message.eventPayload?.status === 1 && marriage?.status === 0 && !marriage.isConfirmed) {
        await MarriageModule.updateOne({ chatId: message.peerId, userFirstId: message.eventPayload?.userFromId, userSecondId: message.eventPayload?.userId }, { status: 1, checkDate: moment().add(1, 'hour').toDate() });
        let result = 'Уважаемые пользователи беседы.';
        result = result.concat(`\nСегодня — самое прекрасное и незабываемое событие в вашей жизни. Создание семьи – это начало доброго союза двух любящих сердец.`);
        result = result.concat(`\nС этого дня вы пойдёте по жизни рука об руку, вместе переживая и радость счастливых дней, и огорчения.`);
        result = result.concat(`\nКак трудно в нашем сложном и огромном мире встретить человека, который будет любить, и ценить, принимать твои недостатки и восхищаться достоинствами, который всегда поймет и простит. Судьба подарила вам счастье, встретив такого человека!`);
        result = result.concat(`\nСоблюдая торжественный обряд перед регистрацией брака, в присутствии ваших родных и друзей, прошу вас ответить ${await stringifyMention({ userId: message.eventPayload?.userFromId })}, является ли ваше желание стать супругами свободным, взаимным и искренним, готовы ли вы разделить это счастье и эту ответственность, поддерживать и любить друг друга и в горе и в радости?`);

        const builder = Keyboard.builder()
          .callbackButton({
            label: 'Да',
            payload: {
              command: CommandVkEnum.marriage,
              status: 2,
              userId: message.eventPayload?.userFromId,
              userFromId: message.userId
            },
            color: Keyboard.POSITIVE_COLOR
          }).callbackButton({
            label: 'Нет',
            payload: {
              command: CommandVkEnum.marriage,
              status: 0,
              userId: message.eventPayload?.userFromId,
              userFromId: message.userId
            },
            color: Keyboard.NEGATIVE_COLOR
          });

        await vk.api.messages.send({
          peer_id: message.peerId,
          random_id: moment().unix(),
          message: result,
          keyboard: builder.inline()
        }).catch(console.error);
      }
      if (marriage && message.eventPayload?.status === 2 && marriage?.status === 1 && !marriage.isConfirmed) {
        await MarriageModule.updateOne({ chatId: message.peerId, userFirstId: message.eventPayload?.userId, userSecondId: message.eventPayload?.userFromId }, { status: 2, checkDate: moment().add(1, 'hour').toDate() });
        const result = `Ваш ответ ${await stringifyMention({ userId: message.eventPayload?.userFromId })}?`;

        const builder = Keyboard.builder()
          .callbackButton({
            label: 'Да',
            payload: {
              command: CommandVkEnum.marriage,
              status: 3,
              userId: message.eventPayload?.userFromId,
              userFromId: message.userId
            },
            color: Keyboard.POSITIVE_COLOR
          }).callbackButton({
            label: 'Нет',
            payload: {
              command: CommandVkEnum.marriage,
              status: 0,
              userId: message.eventPayload?.userFromId,
              userFromId: message.userId
            },
            color: Keyboard.NEGATIVE_COLOR
          });

        await vk.api.messages.send({
          peer_id: message.peerId,
          random_id: moment().unix(),
          message: result,
          keyboard: builder.inline()
        }).catch(console.error);
      }
      if (marriage && message.eventPayload?.status === 3 && marriage?.status === 2 && !marriage.isConfirmed) {
        await MarriageModule.updateOne({ chatId: message.peerId, userFirstId: message.eventPayload?.userFromId, userSecondId: message.eventPayload?.userId }, { status: 0, isConfirmed: true, marriageDate: moment().toDate(), checkDate: null });
        let result = '';

        result = result.concat(`С вашего взаимного согласия, доброй воле и в соответствии с Семейным кодексом Беседы Ваш брак регистрируется.`);
        result = result.concat(`\nВ знак верности и непрерывности брачного союза, в знак любви и преданности друг другу прошу вас обменяться обручальными кольцами, которые с давних времен символизируют святость брака, и пусть они напоминают вам, что ваши сердца всегда будут рядом.`);
        result = result.concat(`\nС этого момента вы стали еще ближе друг другу, вы стали настоящей семьёй. Любите, берегите и уважайте друг друга!`);

        await vk.api.messages.send({
          peer_id: message.peerId,
          random_id: moment().unix(),
          message: result
        }).catch(console.error);
      }
    }
  }
}
