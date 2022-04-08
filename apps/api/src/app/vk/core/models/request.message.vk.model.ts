import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Chat } from "@bot-sadvers/shared/schemas/chat.schema";
import { User } from "@bot-sadvers/shared/schemas/user.schema";
import { ContextDefaultState, MessageContext } from "vk-io";

export class RequestMessageVkModel {
  public command: CommandVkEnum;
  public fullText: string;
  public text: string[];
  public msgObject: MessageContext<ContextDefaultState>;
  public chat: Chat;
  public user: User;
}
