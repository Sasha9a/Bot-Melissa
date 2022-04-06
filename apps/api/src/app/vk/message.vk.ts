import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/error.utils.vk";
import { checkBanList, createChat } from "@bot-sadvers/api/vk/module/chat/chat.utils.vk";
import {
  autoKickList,
  banList,
  clearBanList,
  getGreetings,
  getRules,
  setGreetings, setMaxWarn,
  setRules,
  updateAll
} from "@bot-sadvers/api/vk/module/chat/chat.vk";
import { accessCheck } from "@bot-sadvers/api/vk/module/status/status.utils.vk";
import { getCommandsStatus, setCommandStatus, setNameStatus } from "@bot-sadvers/api/vk/module/status/status.vk";
import { isOwnerMember, stringifyMention } from "@bot-sadvers/api/vk/module/user/user.utils.vk";
import {
  autoKick,
  autoKickMinus,
  ban,
  banMinus,
  getStatuses,
  getUser,
  getUserMe,
  kick,
  setIcon,
  setIconMe,
  setNick,
  setNickMe,
  setStatus
} from "@bot-sadvers/api/vk/module/user/user.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";
import { ContextDefaultState, MessageContext } from "vk-io";
import { environment } from "../../environments/environment";

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
  { command: CommandVkEnum.setMaxWarn, func: setMaxWarn }
];

export async function parseMessage(message: MessageContext<ContextDefaultState>) {
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
