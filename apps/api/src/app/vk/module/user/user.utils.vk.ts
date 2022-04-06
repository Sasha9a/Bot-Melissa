import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { createChat } from "@bot-sadvers/api/vk/module/chat/chat.utils.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { Chat, ChatModule } from "@bot-sadvers/shared/schemas/chat.schema";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import * as moment from "moment-timezone";
import { IResolvedOwnerResource, IResolvedTargetResource, resolveResource } from "vk-io";

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
  if (dataUser[0]) {
    return `[id${dataUser[0].id}|${dataUser[0].first_name + ' ' + dataUser[0].last_name}]`;
  } else {
    return '';
  }
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
  return user?.is_owner as boolean;
}

export async function templateGetUser(user: User): Promise<string> {
  const status: Status = await StatusModule.findOne({ chatId: user.chatId, status: user?.status });
  let chat: Chat = await ChatModule.findOne({ chatId: user.chatId });
  if (!chat) {
    chat = await createChat(user.chatId);
  }
  let result = `Участник ${await stringifyMention(user.peerId)}:`;
  if (user?.joinDate) {
    result = result.concat(`\nВ беседе c ${moment(user.joinDate).format('DD.MM.YYYY HH:mm')} (${moment().diff(user.joinDate, 'days')} дн.)`);
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
  result = result.concat(`\nПредупреждения: ${user?.warn || 0} / ${chat.maxWarn}`);
  return result;
}

export async function getResolveResource(text: string): Promise<void | IResolvedTargetResource | IResolvedOwnerResource> {
  return await resolveResource({
    api: vk.api,
    resource: text
  }).catch(console.error);
}
