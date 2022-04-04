import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { vk } from "@bot-sadvers/api/vk/vk";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";

export async function createUser(req: RequestMessageVkModel): Promise<User> {
  const user: User = new UserModule({
    peerId: req.msgObject.senderId,
    chatId: req.msgObject.peerId,
    status: 0
  });
  return await user.save();
}

export async function stringifyMention(userId: number): Promise<string> {
  const dataUser = await vk.api.users.get({ user_ids: [userId] });
  return `[id${dataUser[0].id}|${dataUser[0].first_name + ' ' + dataUser[0].last_name}]`;
}

export function parseMention(mention: string): { id: number, name: string } {
  if (mention.split('|').length !== 2) {
    return null;
  }
  return {
    id: Number(mention.substring(3).split('|')[0]),
    name: mention.split('|')[1].slice(0, -1)
  };
}

export async function isOwnerMember(peerId: number, chatId: number): Promise<boolean> {
  const members = await vk.api.messages.getConversationMembers({ peer_id: chatId });
  const user = members.items.find((member) => member.member_id === peerId);
  return user.is_owner as boolean;
}
