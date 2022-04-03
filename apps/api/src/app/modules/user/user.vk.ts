import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import { ContextDefaultState, MessageContext } from "vk-io";

export async function setNick(message: MessageContext<ContextDefaultState>) {
  if (message.peerType === 'chat') {
    let user: User = await UserModule.findOne({ peerId: message.senderId, chatId: message.peerId });
    if (!user) {
      user = new UserModule({
        peerId: message.senderId,
        chatId: message.peerId
      });
      await user.save();
    }
    user.nick = message.text.substring(message.text.indexOf('мне ник') + 'мне ник '.length + 1);
    await user.save();
    message.send('Ваш ник установлен').catch(console.error);
  }
}

export async function setIcon(message: MessageContext<ContextDefaultState>) {
  if (message.peerType === 'chat') {
    let user: User = await UserModule.findOne({ peerId: message.senderId, chatId: message.peerId });
    if (!user) {
      user = new UserModule({
        peerId: message.senderId,
        chatId: message.peerId
      });
      await user.save();
    }
    user.icon = message.text.substring(message.text.indexOf('мне значок') + 'мне значок '.length + 1);
    await user.save();
    message.send('Ваш значок установлен').catch(console.error);
  }
}

export async function getUser(message: MessageContext<ContextDefaultState>) {
  if (message.peerType === 'chat') {
    let user = await UserModule.findOne({ peerId: message.senderId, chatId: message.peerId });
    if (!user) {
      user = new UserModule({
        peerId: message.senderId,
        chatId: message.peerId
      });
      await user.save();
    }
    const result = `Ваш ник: ${user?.nick || 'Нет'}\nВаш значок: ${user?.icon || 'Нет'}`;
    message.send(result).catch(console.error);
  }
}
