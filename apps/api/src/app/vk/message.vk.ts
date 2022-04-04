import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { getUser, setIcon, setNick, setStatus, updateAll } from "@bot-sadvers/api/vk/module/user/user.vk";
import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { ContextDefaultState, MessageContext } from "vk-io";

const commands: { command: CommandVkEnum, func: (req: RequestMessageVkModel) => Promise<any> }[] = [
  { command: CommandVkEnum.updateAll, func: updateAll },
  { command: CommandVkEnum.getUser, func: getUser },
  { command: CommandVkEnum.setNick, func: setNick },
  { command: CommandVkEnum.setIcon, func: setIcon },
  { command: CommandVkEnum.setStatus, func: setStatus }
];

export function parseMessage(message: MessageContext<ContextDefaultState>) {
  const request: RequestMessageVkModel = new RequestMessageVkModel();
  for (const command of commands) {
    if (message.text?.toLowerCase().startsWith(command.command) && (!message.text[command.command.length] || message.text[command.command.length] === ' ')) {
      request.command = command.command;
      request.fullText = message.text.substring(message.text.indexOf(command.command) + command.command.length + 2);
      request.text = request.fullText.length ? request.fullText.split(' ') : [];
      request.msgObject = message;
      command.func(request).catch(console.error);
      break;
    }
  }
}
