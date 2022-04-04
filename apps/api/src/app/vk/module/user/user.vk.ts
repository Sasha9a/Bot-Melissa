import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";

export async function setNick(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req);
    }
    user.nick = req.fullText;
    await user.save();
    req.msgObject.send('Ваш ник установлен').catch(console.error);
  }
}

export async function setIcon(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req);
    }
    user.icon = req.fullText;
    await user.save();
    req.msgObject.send('Ваш значок установлен').catch(console.error);
  }
}

export async function getUser(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let user: User = await UserModule.findOne({ peerId: req.msgObject.senderId, chatId: req.msgObject.peerId });
    if (!user) {
      user = await createUser(req);
    }
    let result = `Ваш ник: ${user?.nick || 'Нет'}`;
    result = result.concat(`\nВаш значок: ${user?.icon || 'Нет'}`);
    req.msgObject.send(result).catch(console.error);
  }
}

export async function createUser(req: RequestMessageVkModel): Promise<User> {
  const user: User = new UserModule({
    peerId: req.msgObject.senderId,
    chatId: req.msgObject.peerId
  });
  return await user.save();
}
