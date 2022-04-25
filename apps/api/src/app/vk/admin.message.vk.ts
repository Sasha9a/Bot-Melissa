import { RequestAdminMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.admin.message.vk.model";
import { releaseUpdate } from "@bot-sadvers/api/vk/module/admin/admin.vk";
import { AdminCommandVkEnum } from "@bot-sadvers/shared/enums/admin.command.vk.enum";
import { ContextDefaultState, MessageContext } from "vk-io";

export const commands: { command: AdminCommandVkEnum, func: (req: RequestAdminMessageVkModel) => Promise<any>, argv: string }[] = [
  { command: AdminCommandVkEnum.releaseUpdate, func: releaseUpdate, argv: '(текст)' }
];

export async function parseAdminMessage(message: MessageContext<ContextDefaultState>) {
  const request: RequestAdminMessageVkModel = new RequestAdminMessageVkModel();
  for (const command of commands) {
    if (message.text?.toLowerCase().startsWith(command.command) && (!message.text[command.command.length] || message.text[command.command.length] === ' ')) {
      request.command = command.command;
      request.msgObject = message;
      request.fullText = message.text.substring(message.text.indexOf(command.command) + command.command.length + 2);
      request.text = request.fullText.length ? request.fullText.split(' ') : [];
      command.func(request).catch(console.error);
      break;
    }
  }
}
