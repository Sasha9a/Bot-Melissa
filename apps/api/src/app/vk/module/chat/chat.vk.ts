import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/error.utils.vk";
import { createChat } from "@bot-sadvers/api/vk/module/chat/chat.utils.vk";
import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";

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
