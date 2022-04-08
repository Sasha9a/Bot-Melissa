import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";
import * as moment from "moment-timezone";

export async function createChat(chatId: number): Promise<Chat> {
  const chat: Chat = new ChatModule(<Partial<Chat>>{
    chatId: chatId,
    maxWarn: 3
  });
  return await chat.save();
}

export async function checkBanList(chat: Chat): Promise<void> {
  if (chat) {
    for (const obj of chat.banList) {
      if (moment().diff(moment(obj.endDate), 'minutes') > 0) {
        chat.banList = chat.banList.filter((u) => u.id !== obj.id);
        chat.markModified('banList');
        await chat.save();
      }
    }
  }
}

export async function checkMuteList(chat: Chat): Promise<void> {
  if (chat) {
    for (const obj of chat.muteList) {
      if (moment().diff(moment(obj.endDate), 'minutes') > 0) {
        chat.muteList = chat.muteList.filter((u) => u.id !== obj.id);
        chat.markModified('muteList');
        await chat.save();
      }
    }
  }
}
