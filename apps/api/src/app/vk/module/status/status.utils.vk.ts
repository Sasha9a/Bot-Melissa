import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Command, CommandModule } from "@bot-sadvers/shared/schemas/command.schema";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";
import { User, UserModule } from "@bot-sadvers/shared/schemas/user.schema";

export async function createStatus(statusNumber: number, chatId: number): Promise<Status> {
  const status: Status = new StatusModule({
    chatId: chatId,
    status: statusNumber
  });
  return await status.save();
}

export async function createCommand(command: CommandVkEnum, status: number, chatId: number): Promise<Command> {
  const _command: Command = new CommandModule(<Command>{
    chatId: chatId,
    command: command,
    status: status
  });
  return await _command.save();
}

export async function accessCheck(peerId: number, command: CommandVkEnum, chatId: number): Promise<boolean> {
  const user: User = await UserModule.findOne({ peerId: peerId, chatId: chatId });
  const infoCommand: Command = await CommandModule.findOne({ chatId: chatId, command: command });
  return (user?.status || 0) >= (infoCommand?.status || 0);
}
