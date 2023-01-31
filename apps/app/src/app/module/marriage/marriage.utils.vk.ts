import { stringifyMention } from '@bot-melissa/app/module/user/user.utils.vk';
import { vk } from '@bot-melissa/app/vk';
import { CommandVkEnum } from '@bot-melissa/shared/enums/command.vk.enum';
import { Marriage, MarriageModule } from '@bot-melissa/shared/schemas/marriage.schema';
import * as moment from 'moment-timezone';
import { ContextDefaultState, Keyboard, MessageContext } from 'vk-io';

export const checkTimeMarriage = async () => {
  const marriages: Marriage[] = await MarriageModule.find({
    isConfirmed: false,
    $or: [{ checkDate: { $lte: moment().toDate() } }, { checkDate: null }]
  });
  for (const marriage of marriages) {
    await MarriageModule.deleteOne({ chatId: marriage.chatId, userFirstId: marriage.userFirstId, userSecondId: marriage.userSecondId });
    let result = `${await stringifyMention({ userId: marriage.userFirstId })}`;
    result = result.concat(` и ${await stringifyMention({ userId: marriage.userSecondId })}`);
    result = result.concat(` не смогли вовремя расписаться`);
    await vk.api.messages.send({ peer_id: marriage.chatId, random_id: moment().unix(), message: result }).catch(console.error);
  }
};

export const checkMessageToMarriage = async (message: MessageContext<ContextDefaultState>) => {
  if (message.replyMessage?.conversationMessageId && ['да', 'нет'].includes(message.text?.toLowerCase())) {
    const marriage: Marriage = await MarriageModule.findOne({
      chatId: message.peerId,
      messageId: message.replyMessage.conversationMessageId
    });
    if (
      marriage &&
      (([0, 2].includes(marriage.status) && message.senderId === marriage.userSecondId) ||
        (marriage.status === 1 && message.senderId === marriage.userFirstId))
    ) {
      if (message.text.toLowerCase() === 'нет') {
        await processMarriage(
          {
            userId: message.senderId,
            peerId: message.peerId,
            eventPayload: {
              command: CommandVkEnum.marriage,
              status: 0,
              userId: message.senderId,
              userFromId: message.senderId === marriage.userFirstId ? marriage.userSecondId : marriage.userFirstId
            }
          },
          marriage
        );
      } else if (marriage.status === 0 && message.text.toLowerCase() === 'да') {
        await processMarriage(
          {
            userId: message.senderId,
            peerId: message.peerId,
            eventPayload: {
              command: CommandVkEnum.marriage,
              status: 1,
              userId: message.senderId,
              userFromId: message.senderId === marriage.userFirstId ? marriage.userSecondId : marriage.userFirstId
            }
          },
          marriage
        );
      } else if (marriage.status === 1 && message.text.toLowerCase() === 'да') {
        await processMarriage(
          {
            userId: message.senderId,
            peerId: message.peerId,
            eventPayload: {
              command: CommandVkEnum.marriage,
              status: 2,
              userId: message.senderId,
              userFromId: message.senderId === marriage.userFirstId ? marriage.userSecondId : marriage.userFirstId
            }
          },
          marriage
        );
      } else if (marriage.status === 2 && message.text.toLowerCase() === 'да') {
        await processMarriage(
          {
            userId: message.senderId,
            peerId: message.peerId,
            eventPayload: {
              command: CommandVkEnum.marriage,
              status: 3,
              userId: message.senderId,
              userFromId: message.senderId === marriage.userFirstId ? marriage.userSecondId : marriage.userFirstId
            }
          },
          marriage
        );
      }
    }
  }
};

export const processMarriage = async (info: { userId: number; peerId: number; eventPayload: any }, marriage: Marriage) => {
  if (marriage && info.eventPayload?.status === 0 && !marriage.isConfirmed) {
    await MarriageModule.deleteOne({
      chatId: info.peerId,
      $or: [
        {
          userFirstId: info.eventPayload?.userFromId,
          userSecondId: info.eventPayload?.userId
        },
        {
          userFirstId: info.eventPayload?.userId,
          userSecondId: info.eventPayload?.userFromId
        }
      ]
    });
    await vk.api.messages
      .send({
        peer_id: info.peerId,
        random_id: moment().unix(),
        message: `${await stringifyMention({ userId: info.eventPayload?.userFromId })} увы, но ${await stringifyMention({
          userId: info.userId
        })} отказался(-ась) от предложения вступление в брак`
      })
      .catch(console.error);
  }
  if (marriage && info.eventPayload?.status === 1 && marriage?.status === 0 && !marriage.isConfirmed) {
    await MarriageModule.updateOne(
      {
        chatId: info.peerId,
        userFirstId: info.eventPayload?.userFromId,
        userSecondId: info.eventPayload?.userId
      },
      { status: 1, checkDate: moment().add(1, 'hour').toDate() }
    );
    let result = 'Уважаемые пользователи беседы.';
    result = result.concat(
      `\nСегодня — самое прекрасное и незабываемое событие в вашей жизни. Создание семьи – это начало доброго союза двух любящих сердец.`
    );
    result = result.concat(`\nС этого дня вы пойдёте по жизни рука об руку, вместе переживая и радость счастливых дней, и огорчения.`);
    result = result.concat(
      `\nКак трудно в нашем сложном и огромном мире встретить человека, который будет любить, и ценить, принимать твои недостатки и восхищаться достоинствами`
    );
    result = result.concat(`, который всегда поймет и простит. Судьба подарила вам счастье, встретив такого человека!`);
    result = result.concat(
      `\nСоблюдая торжественный обряд перед регистрацией брака, в присутствии ваших родных и друзей, прошу вас ответить ${await stringifyMention(
        { userId: info.eventPayload?.userFromId }
      )}`
    );
    result = result.concat(
      `, является ли ваше желание стать супругами свободным, взаимным и искренним, готовы ли вы разделить это счастье и эту ответственность, поддерживать и любить друг друга и в горе и в радости?`
    );

    const builder = Keyboard.builder()
      .callbackButton({
        label: 'Да',
        payload: {
          command: CommandVkEnum.marriage,
          status: 2,
          userId: info.eventPayload?.userFromId,
          userFromId: info.userId
        },
        color: Keyboard.POSITIVE_COLOR
      })
      .callbackButton({
        label: 'Нет',
        payload: {
          command: CommandVkEnum.marriage,
          status: 0,
          userId: info.eventPayload?.userFromId,
          userFromId: info.userId
        },
        color: Keyboard.NEGATIVE_COLOR
      });

    await vk.api.messages
      .send({
        peer_ids: info.peerId,
        random_id: moment().unix(),
        message: result,
        keyboard: builder.inline()
      })
      .then(async (msg) => {
        await MarriageModule.updateOne(
          {
            chatId: info.peerId,
            userFirstId: info.eventPayload?.userFromId,
            userSecondId: info.eventPayload?.userId
          },
          { messageId: msg[0]['conversation_message_id'] }
        );
      })
      .catch(console.error);
  }
  if (marriage && info.eventPayload?.status === 2 && marriage?.status === 1 && !marriage.isConfirmed) {
    await MarriageModule.updateOne(
      {
        chatId: info.peerId,
        userFirstId: info.eventPayload?.userId,
        userSecondId: info.eventPayload?.userFromId
      },
      { status: 2, checkDate: moment().add(1, 'hour').toDate() }
    );
    const result = `Ваш ответ ${await stringifyMention({ userId: info.eventPayload?.userFromId })}?`;

    const builder = Keyboard.builder()
      .callbackButton({
        label: 'Да',
        payload: {
          command: CommandVkEnum.marriage,
          status: 3,
          userId: info.eventPayload?.userFromId,
          userFromId: info.userId
        },
        color: Keyboard.POSITIVE_COLOR
      })
      .callbackButton({
        label: 'Нет',
        payload: {
          command: CommandVkEnum.marriage,
          status: 0,
          userId: info.eventPayload?.userFromId,
          userFromId: info.userId
        },
        color: Keyboard.NEGATIVE_COLOR
      });

    await vk.api.messages
      .send({
        peer_ids: info.peerId,
        random_id: moment().unix(),
        message: result,
        keyboard: builder.inline()
      })
      .then(async (msg) => {
        await MarriageModule.updateOne(
          {
            chatId: info.peerId,
            userFirstId: info.eventPayload?.userId,
            userSecondId: info.eventPayload?.userFromId
          },
          { messageId: msg[0]['conversation_message_id'] }
        );
      })
      .catch(console.error);
  }
  if (marriage && info.eventPayload?.status === 3 && marriage?.status === 2 && !marriage.isConfirmed) {
    await MarriageModule.updateOne(
      {
        chatId: info.peerId,
        userFirstId: info.eventPayload?.userFromId,
        userSecondId: info.eventPayload?.userId
      },
      { status: 0, isConfirmed: true, marriageDate: moment().toDate(), checkDate: null, messageId: null }
    );
    let result = '';

    result = result.concat(`С вашего взаимного согласия, доброй воле и в соответствии с Семейным кодексом Беседы Ваш брак регистрируется.`);
    result = result.concat(
      `\nВ знак верности и непрерывности брачного союза, в знак любви и преданности друг другу прошу вас обменяться обручальными кольцами`
    );
    result = result.concat(
      `, которые с давних времен символизируют святость брака, и пусть они напоминают вам, что ваши сердца всегда будут рядом.`
    );
    result = result.concat(
      `\nС этого момента вы стали еще ближе друг другу, вы стали настоящей семьёй. Любите, берегите и уважайте друг друга!`
    );

    await vk.api.messages
      .send({
        peer_id: info.peerId,
        random_id: moment().unix(),
        message: result
      })
      .catch(console.error);
  }
};
