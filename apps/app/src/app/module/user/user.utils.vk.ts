import { RequestMessageVkModel } from '@bot-melissa/app/core/models/request.message.vk.model';
import { errorSend } from '@bot-melissa/app/core/utils/customMessage.utils.vk';
import { vk } from '@bot-melissa/app/vk';
import { Chat, ChatModule } from '@bot-melissa/shared/schemas/chat.schema';
import { Marriage, MarriageModule } from '@bot-melissa/shared/schemas/marriage.schema';
import { Status, StatusModule } from '@bot-melissa/shared/schemas/status.schema';
import { User, UserModule } from '@bot-melissa/shared/schemas/user.schema';
import * as moment from 'moment-timezone';
import { ContextDefaultState, IResolvedOwnerResource, IResolvedTargetResource, MessageContext, resolveResource } from 'vk-io';
import { UsersUserFull } from 'vk-io/lib/api/schemas/objects';

export const createUser = async (info: Partial<User>): Promise<User> => {
  const user: User = new UserModule(info);
  return await user.save();
};

export const stringifyMention = async (info: { userId?: number; userInfo?: UsersUserFull }): Promise<string> => {
  let dataUser;
  if (info.userInfo) {
    dataUser = info.userInfo;
  } else {
    dataUser = await vk.api.users.get({ user_ids: [info.userId] });
    dataUser = dataUser[0];
  }
  if (dataUser) {
    return `[id${dataUser.id}|${dataUser.first_name + ' ' + dataUser.last_name}]`;
  } else {
    return '';
  }
};

export const isOwnerMember = async (peerId: number, chatId: number): Promise<boolean> => {
  const chatInfo = await vk.api.messages.getConversationsById({ peer_ids: chatId });
  return chatInfo.items[0]?.chat_settings?.owner_id === peerId;
};

export const templateGetUser = async (req: RequestMessageVkModel, userId: number): Promise<string> => {
  const user = req.members.find((m) => m.id === userId);
  const status: Status = await StatusModule.findOne({ chatId: req.chat.chatId, status: user?.info?.status }, { name: 1 });
  const marriages: Marriage[] = await MarriageModule.find({
    chatId: req.chat.chatId,
    isConfirmed: true,
    $or: [{ userFirstId: userId }, { userSecondId: userId }]
  });
  let result = `Участник ${await stringifyMention({ userId: userId, userInfo: user?.profile })}:`;
  if (user?.info?.joinDate) {
    result = result.concat(
      `\nВ беседе c ${moment(user?.info?.joinDate).format('DD.MM.YYYY HH:mm')} (${moment().diff(user?.info?.joinDate, 'days')} дн.)`
    );
  } else {
    result = result.concat(`\nВ беседе c -`);
  }
  result = result.concat(`\nВозраст: ${user?.info?.age || '-'}`);
  result = result.concat(`\nНик: ${user?.info?.nick || '-'}`);
  result = result.concat(`\nЗначок: ${user?.info?.icon || '-'}`);
  if (status?.name?.length) {
    result = result.concat(`\nСтатус: ${status.name} (${user?.info?.status || 0})`);
  } else {
    result = result.concat(`\nСтатус: ${user?.info?.status || 0}`);
  }
  result = result.concat(`\nПредупреждения: ${user?.info?.warn || 0} / ${req.chat.maxWarn}`);
  if (marriages?.length) {
    result = result.concat(`\nВ браке с `);
    for (let i = 0; i != marriages.length; i++) {
      const userResultId = marriages[i].userFirstId === user?.info?.peerId ? marriages[i].userSecondId : marriages[i].userFirstId;
      result = result.concat(
        `${await stringifyMention({ userId: userResultId, userInfo: req.members.find((m) => m.id === userResultId)?.profile })}${
          i !== marriages.length - 1 ? ', ' : ''
        }`
      );
    }
  }
  result = result.concat(
    `\nСемейное положение: ${
      user?.info?.isBusy ? `Занят${user.profile?.sex === 1 ? 'а' : ''}` : `Свобод${user.profile?.sex === 1 ? 'на' : 'ен'}`
    }`
  );
  result = result.concat(`\nО себе: ${user?.info?.aboutMe || '-'}`);
  return result;
};

export const getResolveResource = async (text: string): Promise<void | IResolvedTargetResource | IResolvedOwnerResource> => {
  return await resolveResource({
    api: vk.api,
    resource: text
  }).catch(console.error);
};

export const getFullUserInfo = async (user: string, message: MessageContext<ContextDefaultState>): Promise<User> => {
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
};

export const updateLastActivityUser = async (message: MessageContext<ContextDefaultState>) => {
  await UserModule.updateOne({ peerId: message.senderId, chatId: message.peerId }, { lastActivityDate: moment().toDate() });
};

export const autoKickInDays = async () => {
  const chats: Chat[] = await ChatModule.find({ autoKickInDays: { $gt: 0 } });
  for (const chat of chats) {
    if (!chat.autoKickInDaysDate || moment().diff(moment(chat.autoKickInDaysDate)) / 1000 / 60 / 60 > 12) {
      chat.autoKickInDaysDate = moment().toDate();
      await chat.save();

      const users: User[] = await UserModule.find({ chatId: chat.chatId });
      for (const member of users) {
        if (member.lastActivityDate) {
          const days = moment().diff(moment(member.lastActivityDate)) / 1000 / 60 / 60 / 24;
          if (Math.floor(days) >= chat.autoKickInDays && chat.autoKickToStatus >= member.status) {
            await vk.api.messages
              .removeChatUser({ chat_id: chat.chatId - 2000000000, member_id: member.peerId, user_id: member.peerId })
              .catch(console.error);
          }
        } else if (member.joinDate) {
          const days = moment().diff(moment(member.joinDate)) / 1000 / 60 / 60 / 24;
          if (Math.floor(days) >= chat.autoKickInDays && chat.autoKickToStatus >= member.status) {
            await vk.api.messages
              .removeChatUser({ chat_id: chat.chatId - 2000000000, member_id: member.peerId, user_id: member.peerId })
              .catch(console.error);
          }
        }
      }
    }
  }
};
