import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { vk } from "@bot-sadvers/api/vk/vk";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import * as moment from "moment-timezone";

export async function createUser(peerId: number, req: RequestMessageVkModel): Promise<User> {
  const user: User = new UserModule({
    peerId: peerId,
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

export async function templateGetUser(user: User): Promise<string> {
  const status: Status = await StatusModule.findOne({ chatId: user.chatId, status: user?.status });
  let result = `Участник ${await stringifyMention(user.peerId)}:`;
  if (user?.joinDate) {
    result = result.concat(`\nВ беседе c ${moment(user.joinDate).format('DD.MM.YYYY HH:mm ')} (${moment().diff(user.joinDate, 'days')} дн.)`);
  } else {
    result = result.concat(`\nВ беседе c -`);
  }
  result = result.concat(`\nНик: ${user?.nick || '-'}`);
  result = result.concat(`\nЗначок: ${user?.icon || '-'}`);
  if (status?.name?.length) {
    result = result.concat(`\nСтатус: ${status.name} (${user?.status || 0})`);
  } else {
    result = result.concat(`\nСтатус: ${user?.status || 0}`);
  }
  return result;
}
