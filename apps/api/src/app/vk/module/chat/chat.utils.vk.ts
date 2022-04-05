import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";

export async function createChat(chatId: number): Promise<Chat> {
  const chat: Chat = new ChatModule(<Partial<Chat>>{
    chatId: chatId
  });
  return await chat.save();
}
