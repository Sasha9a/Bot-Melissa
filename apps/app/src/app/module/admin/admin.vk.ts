import { RequestAdminMessageVkModel } from '@bot-melissa/app/core/models/request.admin.message.vk.model';
import { errorSend, yesSend } from '@bot-melissa/app/core/utils/customMessage.utils.vk';
import { vk } from '@bot-melissa/app/vk';
import { Chat, ChatModule } from '@bot-melissa/shared/schemas/chat.schema';
import * as moment from 'moment-timezone';

export const newsletter = async (req: RequestAdminMessageVkModel) => {
  if (req.text.length < 1) {
    return errorSend(req.msgObject, 'Не все параметры введены\nСоздать рассылку [текст]');
  }
  await req.msgObject.send('Пошел процесс отправки всем сообщения...').catch(console.error);
  const chats: Chat[] = await ChatModule.find({}, { chatId: 1 });
  for (const chat of chats) {
    setTimeout(async () => {
      await vk.api.messages
        .send({
          peer_id: chat.chatId,
          random_id: moment().unix(),
          message: req.fullText
        })
        .catch(console.error);
    }, 500);
  }
  await yesSend(req.msgObject, 'Сообщения всем были отправлены');
};
