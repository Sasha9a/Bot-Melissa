import { AdminCommandVkEnum } from "@bot-sadvers/shared/enums/admin.command.vk.enum";
import { ContextDefaultState, MessageContext } from "vk-io";

export class RequestAdminMessageVkModel {
  public command: AdminCommandVkEnum;
  public fullText: string;
  public text: string[];
  public msgObject: MessageContext<ContextDefaultState>;
}
