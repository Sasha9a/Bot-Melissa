import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/error.utils.vk";
import { checkBanList, checkMuteList, createChat } from "@bot-sadvers/api/vk/module/chat/chat.utils.vk";
import {
  autoKickList,
  banList,
  clearBanList, clearMuteList,
  getGreetings,
  getRules, muteList,
  setGreetings, setMarriages, setMaxWarn,
  setRules,
  updateAll
} from "@bot-sadvers/api/vk/module/chat/chat.vk";
import { divorce, marriage, marriages } from "@bot-sadvers/api/vk/module/marriage/marriage.vk";
import { accessCheck } from "@bot-sadvers/api/vk/module/status/status.utils.vk";
import { getCommandsStatus, setCommandStatus, setNameStatus } from "@bot-sadvers/api/vk/module/status/status.vk";
import { isOwnerMember, stringifyMention } from "@bot-sadvers/api/vk/module/user/user.utils.vk";
import {
  autoKick,
  autoKickMinus,
  ban,
  banMinus, clearWarnList, convene,
  getStatuses,
  getUser,
  getUserMe,
  kick, mute, muteMinus,
  setIcon,
  setIconMe,
  setNick,
  setNickMe,
  setStatus, warn, warnList, warnMinus
} from "@bot-sadvers/api/vk/module/user/user.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";
import { Marriage, MarriageModule } from "@bot-sadvers/shared/schemas/marriage.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import { ContextDefaultState, Keyboard, MessageContext, MessageEventContext } from "vk-io";
import { MessagesConversationMember, UsersUserFull } from "vk-io/lib/api/schemas/objects";
import { environment } from "../../environments/environment";
import * as moment from "moment-timezone";

const commands: { command: CommandVkEnum, func: (req: RequestMessageVkModel) => Promise<any> }[] = [
  { command: CommandVkEnum.updateAll, func: updateAll },
  { command: CommandVkEnum.getUserMe, func: getUserMe },
  { command: CommandVkEnum.getUser, func: getUser },
  { command: CommandVkEnum.setNickMe, func: setNickMe },
  { command: CommandVkEnum.setNick, func: setNick },
  { command: CommandVkEnum.setIconMe, func: setIconMe },
  { command: CommandVkEnum.setIcon, func: setIcon },
  { command: CommandVkEnum.setStatus, func: setStatus },
  { command: CommandVkEnum.getStatuses, func: getStatuses },
  { command: CommandVkEnum.setNameStatus, func: setNameStatus },
  { command: CommandVkEnum.setCommandStatus, func: setCommandStatus },
  { command: CommandVkEnum.getCommandsStatus, func: getCommandsStatus },
  { command: CommandVkEnum.setRules, func: setRules },
  { command: CommandVkEnum.getRules, func: getRules },
  { command: CommandVkEnum.setGreetings, func: setGreetings },
  { command: CommandVkEnum.getGreetings, func: getGreetings },
  { command: CommandVkEnum.kick, func: kick },
  { command: CommandVkEnum.autoKick, func: autoKick },
  { command: CommandVkEnum.autoKickMinus, func: autoKickMinus },
  { command: CommandVkEnum.autoKickList, func: autoKickList },
  { command: CommandVkEnum.ban, func: ban },
  { command: CommandVkEnum.banMinus, func: banMinus },
  { command: CommandVkEnum.banList, func: banList },
  { command: CommandVkEnum.clearBanList, func: clearBanList },
  { command: CommandVkEnum.setMaxWarn, func: setMaxWarn },
  { command: CommandVkEnum.warn, func: warn },
  { command: CommandVkEnum.warnMinus, func: warnMinus },
  { command: CommandVkEnum.warnList, func: warnList },
  { command: CommandVkEnum.clearWarnList, func: clearWarnList },
  { command: CommandVkEnum.mute, func: mute },
  { command: CommandVkEnum.muteMinus, func: muteMinus },
  { command: CommandVkEnum.muteList, func: muteList },
  { command: CommandVkEnum.clearMuteList, func: clearMuteList },
  { command: CommandVkEnum.convene, func: convene },
  { command: CommandVkEnum.setMarriages, func: setMarriages },
  { command: CommandVkEnum.marriage, func: marriage },
  { command: CommandVkEnum.marriages, func: marriages },
  { command: CommandVkEnum.divorce, func: divorce }
];

export async function parseMessage(message: MessageContext<ContextDefaultState>) {
  const chat: Chat = await ChatModule.findOne({ chatId: message.peerId });
  await checkMuteList(chat);
  if (chat.muteList.findIndex((u) => u.id === message.senderId) !== -1) {
    await vk.api.messages.delete({ cmids: message.conversationMessageId, delete_for_all: true, peer_id: message.peerId }).catch(console.error);
    return;
  }
  const request: RequestMessageVkModel = new RequestMessageVkModel();
  for (const command of commands) {
    if (message.text?.toLowerCase().startsWith(command.command) && (!message.text[command.command.length] || message.text[command.command.length] === ' ')) {
      if (await accessCheck(message.senderId, command.command, message.peerId)) {
        request.command = command.command;
        request.fullText = message.text.substring(message.text.indexOf(command.command) + command.command.length + 2);
        request.text = request.fullText.length ? request.fullText.split(' ') : [];
        request.msgObject = message;
        command.func(request).catch(console.error);
      } else {
        await errorSend(message, 'Нет доступа');
      }
      break;
    }
  }
}

export async function inviteUser(message: MessageContext<ContextDefaultState>) {
  if (message.eventMemberId === -environment.groupId) {
    await message.send('Добрый день всем! Я бот администратор :)\nЧтобы я заработал, выдайте мне админку и Владелец беседы введи команду: "Обновить"').catch(console.error);
  } else {
    const chat: Chat = await ChatModule.findOne({ chatId: message.peerId });
    if (!chat) {
      await createChat(message.peerId);
    }
    await checkBanList(chat);
    if (chat.autoKickList && chat.autoKickList.findIndex((id) => id === message.eventMemberId) !== -1) {
      await vk.api.messages.removeChatUser({ chat_id: message.peerId - 2000000000, member_id: message.eventMemberId, user_id: message.eventMemberId }).catch(console.error);
      await message.send(`Пользователь ${await stringifyMention(message.eventMemberId)} находится в списке автокика`).catch(console.error);
      return;
    }
    if (chat.banList && chat.banList.findIndex((u) => u.id === message.eventMemberId) !== -1) {
      await vk.api.messages.removeChatUser({ chat_id: message.peerId - 2000000000, member_id: message.eventMemberId, user_id: message.eventMemberId }).catch(console.error);
      await message.send(`Пользователь ${await stringifyMention(message.eventMemberId)} находится в списке банлиста`).catch(console.error);
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
      let result = `${await stringifyMention(message.eventMemberId)}, ${chat.greetings}`;
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
      if (message.eventPayload?.status === 0 && !marriage?.isConfirmed) {
        await MarriageModule.deleteOne({ chatId: message.peerId, $or: [ {userFirstId: message.eventPayload?.userFromId, userSecondId: message.eventPayload?.userId}, {userFirstId: message.eventPayload?.userId, userSecondId: message.eventPayload?.userFromId} ] });
        await vk.api.messages.send({
          peer_id: message.peerId,
          random_id: moment().unix(),
          message: `${await stringifyMention(message.eventPayload?.userFromId)} увы, но ${await stringifyMention(message.userId)} отказался(-ась) от предложения вступление в брак`
        }).catch(console.error);
      }
      if (message.eventPayload?.status === 1 && marriage?.status === 0 && !marriage?.isConfirmed) {
        await MarriageModule.updateOne({ chatId: message.peerId, userFirstId: message.eventPayload?.userFromId, userSecondId: message.eventPayload?.userId }, { status: 1 });
        let result = '';

        const members = await vk.api.messages.getConversationMembers({ peer_id: message.peerId });
        let membersList: { id: number, item: MessagesConversationMember, profile: UsersUserFull }[] = [];
        for (const member of members.items) {
          membersList.push({
            id: member.member_id,
            item: member,
            profile: members.profiles.find((profile) => profile.id === member.member_id)
          });
        }
        membersList = membersList.filter((m) => m.id !== message.userId && m.profile);
        for (let i = 0; i != membersList.length; i++) {
          result = result.concat(`${await stringifyMention(membersList[i].item.member_id)}${i !== membersList.length - 1 ? ', ' : ''}`);
        }
        result = result.concat(` Уважаемые пользователи беседы.`);
        result = result.concat(`\nСегодня — самое прекрасное и незабываемое событие в вашей жизни. Создание семьи – это начало доброго союза двух любящих сердец.`);
        result = result.concat(`\nС этого дня вы пойдёте по жизни рука об руку, вместе переживая и радость счастливых дней, и огорчения.`);
        result = result.concat(`\nКак трудно в нашем сложном и огромном мире встретить человека, который будет любить, и ценить, принимать твои недостатки и восхищаться достоинствами, который всегда поймет и простит. Судьба подарила вам счастье, встретив такого человека!`);
        result = result.concat(`\nСоблюдая торжественный обряд перед регистрацией брака, в присутствии ваших родных и друзей, прошу вас ответить ${await stringifyMention(message.eventPayload?.userFromId)}, является ли ваше желание стать супругами свободным, взаимным и искренним, готовы ли вы разделить это счастье и эту ответственность, поддерживать и любить друг друга и в горе и в радости?`);

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
      if (message.eventPayload?.status === 2 && marriage?.status === 1 && !marriage?.isConfirmed) {
        await MarriageModule.updateOne({ chatId: message.peerId, userFirstId: message.eventPayload?.userId, userSecondId: message.eventPayload?.userFromId }, { status: 2 });
        const result = `Ваш ответ ${await stringifyMention(message.eventPayload?.userFromId)}?`;

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
      if (message.eventPayload?.status === 3 && marriage?.status === 2 && !marriage?.isConfirmed) {
        await MarriageModule.updateOne({ chatId: message.peerId, userFirstId: message.eventPayload?.userFromId, userSecondId: message.eventPayload?.userId }, { status: 0, isConfirmed: true, marriageDate: moment().toDate() });
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
