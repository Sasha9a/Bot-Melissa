import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/customMessage.utils.vk";
import { vk } from "@bot-sadvers/api/vk/vk";
import { Chat } from "@bot-sadvers/shared/schemas/chat.schema";
import { Marriage, MarriageModule } from "@bot-sadvers/shared/schemas/marriage.schema";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";
import * as moment from "moment-timezone";
import { ContextDefaultState, IResolvedOwnerResource, IResolvedTargetResource, MessageContext, resolveResource } from "vk-io";
import { MessagesConversationMember, UsersUserFull } from "vk-io/lib/api/schemas/objects";

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

export async function isOwnerMember(peerId: number, chatId: number): Promise<boolean> {
  const members = await vk.api.messages.getConversationMembers({ peer_id: chatId });
  const user = members.items.find((member) => member.member_id === peerId);
  return user?.is_owner as boolean;
}

export async function templateGetUser(user: User, chat: Chat): Promise<string> {
  const status: Status = await StatusModule.findOne({ chatId: user.chatId, status: user?.status });
  const marriages: Marriage[] = await MarriageModule.find({ chatId: chat.chatId, $or: [ { userFirstId: user.peerId }, { userSecondId: user.peerId } ] });
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
  if (marriages?.length) {
    result = result.concat(`\nВ браке с `);
    for (let i = 0; i != marriages.length; i++) {
      result = result.concat(`${await stringifyMention(marriages[i].userFirstId === user.peerId ? marriages[i].userSecondId : marriages[i].userFirstId)}${i !== marriages.length - 1 ? ', ' : ''}`);
    }
  }
  return result;
}

export async function getResolveResource(text: string): Promise<void | IResolvedTargetResource | IResolvedOwnerResource> {
  return await resolveResource({
    api: vk.api,
    resource: text
  }).catch(console.error);
}

export async function getFullUserInfo(user: string, message: MessageContext<ContextDefaultState>): Promise<User> {
  const resource = await getResolveResource(user);
  if (!resource || !['user', 'group'].includes(resource.type)) {
    await errorSend(message, 'Пользователь не верно указан');
    return null;
  }
  const userResult: User = await UserModule.findOne({ peerId: resource.id, chatId: message.peerId });
  if (!userResult) {
    await errorSend(message, 'Нет такого пользователя');
    return null;
  }
  return userResult;
}

export async function updateLastActivityUser(message: MessageContext<ContextDefaultState>) {
  await UserModule.updateOne({ peerId: message.senderId, chatId: message.peerId }, { lastActivityDate: moment().toDate() });
}

export async function autoKickInDays(chat: Chat, message: MessageContext<ContextDefaultState>) {
  if (chat && chat.autoKickInDays > 0 && (!chat.autoKickInDaysDate || moment().diff(moment(chat.autoKickInDaysDate)) / 1000 / 60 / 60 > 12)) {
    chat.autoKickInDaysDate = moment().toDate();
    await chat.save();

    const members = await vk.api.messages.getConversationMembers({ peer_id: message.peerId });
    const users: User[] = await UserModule.find({ chatId: message.peerId });
    let membersList: { id: number, item: MessagesConversationMember, profile: UsersUserFull, user: User }[] = [];
    for (const member of members.items) {
      membersList.push({
        id: member.member_id,
        item: member,
        profile: members.profiles.find((profile) => profile.id === member.member_id),
        user: users.find((u) => u.peerId === member.member_id)
      });
    }
    membersList = membersList.filter((m) => m.profile);
    for (const member of membersList) {
      if (member.user.lastActivityDate) {
        const days = moment().diff(moment(member.user.lastActivityDate)) / 1000 / 60 / 60 / 24;
        if (Number(days.toFixed()) >= chat.autoKickInDays) {
          await vk.api.messages.removeChatUser({ chat_id: message.peerId - 2000000000, member_id: member.id, user_id: member.id }).catch(console.error);
        }
      } else {
        const days = moment().diff(moment(member.user.joinDate)) / 1000 / 60 / 60 / 24;
        if (Number(days.toFixed()) >= chat.autoKickInDays) {
          await vk.api.messages.removeChatUser({ chat_id: message.peerId - 2000000000, member_id: member.id, user_id: member.id }).catch(console.error);
        }
      }
    }
  }
}
