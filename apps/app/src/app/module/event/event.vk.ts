import { PeerTypeVkEnum } from '@bot-melissa/app/core/enums/peer.type.vk.enum';
import { RequestMessageVkModel } from '@bot-melissa/app/core/models/request.message.vk.model';
import { errorSend, yesSend } from '@bot-melissa/app/core/utils/customMessage.utils.vk';
import { stringifyMention } from '@bot-melissa/app/module/user/user.utils.vk';
import { Event, EventModule } from '@bot-melissa/shared/schemas/event.schema';
import * as moment from 'moment-timezone';
import { environment } from '../../../environments/environment';

export const getEvents = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    const events: Event[] = await EventModule.find({ chatId: req.msgObject.peerId });
    events.sort((a, b) => moment(a.eventDate, 'DD-MM-YYYY').diff(moment(b.eventDate, 'DD-MM-YYYY')));
    let result = 'Список грядущих событий:';
    let index = 0;
    for (const event of events) {
      const createdUser = req.members.find((m) => m.id === event.createdUserId);
      result = result.concat(`\n${index ? '\n' : ''}${index + 1}. ${moment(event.eventDate).locale('ru').format('DD.MM.YYYY (ddd)')}`);
      result = result.concat(
        `\nАвтор: ${await stringifyMention({
          userId: event.createdUserId,
          userInfo: createdUser?.profile
        })} ${createdUser?.info?.nick || ''}`
      );
      result = result.concat(`\n${event.name}`);
      index++;
    }
    req.msgObject.send(result, { disable_mentions: true }).catch(console.error);
  }
};

export const addEvent = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} создать событие (дата(01.01.1970)) (название)`);
    }

    const momentData = moment(req.text[0], 'DD.MM.YYYY', true);
    if (!momentData.isValid()) {
      return errorSend(req.msgObject, `Дата неверного формата\nНужно с таким форматом: 01.01.1970`);
    }

    if (!momentData.isAfter(moment().startOf('day').subtract(1, 'day'), 'day')) {
      return errorSend(req.msgObject, `Нельзя создавать события на прошлую дату`);
    }

    const event: Event = new EventModule({
      chatId: req.msgObject.peerId,
      eventDate: momentData.startOf('day').toDate(),
      createdUserId: req.msgObject.senderId,
      name: req.fullText.slice(req.fullText.indexOf(' ') + 1)
    });
    await event.save();
    await yesSend(
      req.msgObject,
      `${await stringifyMention({
        userId: req.msgObject.senderId,
        userInfo: req.members.find((m) => m.id === req.msgObject.senderId)?.profile
      })}: Событие создано`
    );
  }
};

export const deleteEvent = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length !== 1) {
      return errorSend(req.msgObject, `Не все параметры введены\n${environment.botName} удалить событие (номер события)`);
    }

    const events: Event[] = await EventModule.find({ chatId: req.msgObject.peerId }, { eventDate: 1 });
    events.sort((a, b) => moment(a.eventDate, 'DD-MM-YYYY').diff(moment(b.eventDate, 'DD-MM-YYYY')));

    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 1 || Number(req.text[0]) > (events?.length || 0)) {
      return errorSend(req.msgObject, 'Первый аргумент не верный (номер события)');
    }

    await EventModule.deleteOne({ _id: events[Number(req.text[0]) - 1]?.id });

    await yesSend(
      req.msgObject,
      `${await stringifyMention({
        userId: req.msgObject.senderId,
        userInfo: req.members.find((m) => m.id === req.msgObject.senderId)?.profile
      })}: Событие удалено`
    );
  }
};
