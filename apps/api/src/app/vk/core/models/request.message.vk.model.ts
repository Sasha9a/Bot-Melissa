import { CommandVkEnum } from "@bot-sadvers/shared/command.vk.enum";
import { ContextDefaultState, MessageContext } from "vk-io";

export class RequestMessageVkModel {
  public command: CommandVkEnum;
  public fullText: string;
  public text: string[];
  public msgObject: MessageContext<ContextDefaultState>;
}
