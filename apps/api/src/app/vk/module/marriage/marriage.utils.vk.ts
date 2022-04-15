import { stringifyMention } from "@bot-sadvers/api/vk/module/user/user.utils.vk";
import { Chat } from "@bot-sadvers/shared/schemas/chat.schema";
import { Marriage, MarriageModule } from "@bot-sadvers/shared/schemas/marriage.schema";
import { User } from "@bot-sadvers/shared/schemas/user.schema";
import * as moment from "moment-timezone";
import { ContextDefaultState, MessageContext } from "vk-io";
import { MessagesConversationMember, UsersUserFull } from "vk-io/lib/api/schemas/objects";

export async function checkTimeMarriage(chat: Chat, members: { id: number, item: MessagesConversationMember, profile: UsersUserFull, info: User }[], message: MessageContext<ContextDefaultState>) {
  if (chat) {
    const marriages: Marriage[] = await MarriageModule.find({ chatId: chat.chatId, isConfirmed: false });
    for (const marriage of marriages) {
      if (!marriage.checkDate || moment().diff(moment(marriage.checkDate), 'minutes') > 0) {
        await MarriageModule.deleteOne({ chatId: chat.chatId, userFirstId: marriage.userFirstId, userSecondId: marriage.userSecondId });
        let result = `${await stringifyMention({ userId: marriage.userFirstId, userInfo: members.find((m) => m.id === marriage.userFirstId)?.profile })}`;
        result = result.concat(` и ${await stringifyMention({ userId: marriage.userSecondId, userInfo: members.find((m) => m.id === marriage.userSecondId)?.profile })}`);
        result = result.concat(` не смогли вовремя расписаться`);
        await message.send(result).catch(console.error);
      }
    }
  }
}
