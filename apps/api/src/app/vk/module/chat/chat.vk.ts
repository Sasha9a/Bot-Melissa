import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/error.utils.vk";
import { createChat } from "@bot-sadvers/api/vk/module/chat/chat.utils.vk";
import { createCommand } from "@bot-sadvers/api/vk/module/status/status.utils.vk";
import { createUser, isOwnerMember, stringifyMention } from "@bot-sadvers/api/vk/module/user/user.utils.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";
import { Command, CommandModule } from "@bot-sadvers/shared/schemas/command.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";

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
      const chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
      if (!chat) {
        await createChat(req.msgObject.peerId);
      }
      req.msgObject.send(`Данные беседы обновлены`).catch(console.error);
    }
  }
}

export async function setRules(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nНовые правила [текст]');
    }
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    chat.rules = req.fullText;
    await chat.save();
    req.msgObject.send(`Новые правила установлены`).catch(console.error);
  }
}

export async function getRules(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    if (chat.rules) {
      req.msgObject.send(`Текст правил: ${chat.rules}`).catch(console.error);
    } else {
      req.msgObject.send(`Нет правил`).catch(console.error);
    }
  }
}

export async function setGreetings(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 1) {
      return errorSend(req.msgObject, 'Не все параметры введены\nНовое приветствие [текст]');
    }
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    chat.greetings = req.fullText;
    await chat.save();
    req.msgObject.send(`Новое приветствие установлено`).catch(console.error);
  }
}

export async function getGreetings(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    if (chat.greetings) {
      req.msgObject.send(`Текст приветствия: ${chat.greetings}`).catch(console.error);
    } else {
      req.msgObject.send(`Нет приветствия`).catch(console.error);
    }
  }
}

export async function autoKickList(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let chat: Chat = await ChatModule.findOne({ chatId: req.msgObject.peerId });
    if (!chat) {
      chat = await createChat(req.msgObject.peerId);
    }
    if (chat.autoKickList?.length) {
      let result = 'Список пользователей в автокике:';
      for (const peerId of chat.autoKickList) {
        result = result.concat(`\n${await stringifyMention(peerId)}`);
      }
      req.msgObject.send(result).catch(console.error);
    } else {
      req.msgObject.send(`Список автокика пустой`).catch(console.error);
    }
  }
}
