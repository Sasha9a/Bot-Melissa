import { stringifyMention } from '@bot-melissa/app/module/user/user.utils.vk';
import { vk } from '@bot-melissa/app/vk';
import { Antispam, AntispamModule } from '@bot-melissa/shared/schemas/antispam.schema';
import { Chat, ChatModule } from '@bot-melissa/shared/schemas/chat.schema';
import { EventModule } from '@bot-melissa/shared/schemas/event.schema';
import { Horoscope, HoroscopeModule } from '@bot-melissa/shared/schemas/horoscope.schema';
import axios from 'axios';
import * as moment from 'moment-timezone';
import { parse } from 'node-html-parser';

export const createChat = async (chatId: number): Promise<Chat> => {
  const chat: Chat = new ChatModule(<Partial<Chat>>{
    chatId: chatId,
    maxWarn: 3
  });
  return await chat.save();
};

export const createAntispam = async (info: Partial<Antispam>): Promise<Antispam> => {
  const antispam: Antispam = new AntispamModule(info);
  return await antispam.save();
};

export const checkBanList = async (chat: Chat): Promise<void> => {
  if (chat) {
    const local = chat.banList;
    for (const obj of chat.banList) {
      if (moment().diff(moment(obj.endDate), 'minutes') > 0) {
        chat.banList = chat.banList.filter((u) => u.id !== obj.id);
      }
    }
    if (local.length !== chat.banList.length) {
      chat.markModified('banList');
      await chat.save();
    }
  }
};

export const checkMuteList = async (chat: Chat): Promise<void> => {
  if (chat) {
    const local = chat.muteList;
    for (const obj of chat.muteList) {
      if (moment().diff(moment(obj.endDate), 'minutes') > 0) {
        chat.muteList = chat.muteList.filter((u) => u.id !== obj.id);
      }
    }
    if (local.length !== chat.muteList.length) {
      chat.markModified('muteList');
      await chat.save();
    }
  }
};

export const deleteAntispam = async (chat: Chat): Promise<void> => {
  if (chat) {
    await AntispamModule.deleteMany({ chatId: chat.chatId, date: { $lt: moment().startOf('day').toDate() } });
  }
};

export const deleteExpiredEvents = async (chat?: Chat): Promise<void> => {
  if (chat) {
    await EventModule.deleteMany({ chatId: chat.chatId, eventDate: { $lt: moment().startOf('day').toDate() } });
  } else {
    await EventModule.deleteMany({ eventDate: { $lt: moment().startOf('day').toDate() } });
  }
};

export const getZodiacSignsToday = async (): Promise<void> => {
  const horoscopes: Horoscope[] = await HoroscopeModule.find({ date: moment().startOf('day').toDate() });
  if (horoscopes?.length) {
    return;
  }

  const res = await axios.get('https://74.ru/horoscope/daily/');
  const data = parse(res.data);
  const signs = data.querySelector('.central-column-container')?.querySelector('section')?.querySelectorAll('article');

  if (!signs) {
    console.error('Не работает сервис знаков зодиака');
    return;
  }

  for (const sign of signs) {
    const signDivs = sign.querySelectorAll('div');

    const horoscope = new HoroscopeModule(<Partial<Horoscope>>{
      date: moment().startOf('day').toDate(),
      zodiacSign: sign.querySelector('h3')?.text?.toLowerCase(),
      text: signDivs[signDivs.length - 1]?.text
    });
    await horoscope.save();
  }

  await HoroscopeModule.deleteMany({ date: { $lt: moment().subtract(1, 'day').endOf('day').toDate() } });
};

export const checkBirthdays = async (): Promise<void> => {
  const chats: Chat[] = await ChatModule.find({}, { chatId: 1 });
  const today = moment();
  for (const chat of chats) {
    const members = await vk.api.messages.getConversationMembers({ peer_id: chat.chatId, fields: ['bdate'] });
    const birthdays = members.profiles.filter((profile) => {
      const birth = moment(profile.bdate, 'D.M.YYYY');
      return today.day() === birth.day() && today.month() === birth.month();
    });
    if (birthdays?.length) {
      let result = `Дорогие друзья, у нас сегодня есть ${birthdays?.length > 1 ? 'именинники' : 'именинник'}: `;
      for (let i = 0; i < birthdays?.length; i++) {
        result = result.concat(
          `${await stringifyMention({ userId: birthdays[i].id, userInfo: birthdays[i] })}${i + 1 != birthdays.length ? ', ' : '.'}`
        );
      }
      result = result.concat(' Поздравляю с днем рождения! Желаю здоровья, удачи и реализации всех планов!');
      await vk.api.messages
        .send({
          peer_id: chat.chatId,
          random_id: moment().unix(),
          message: result
        })
        .catch(console.error);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};
