import { CommandVkEnum } from '@bot-melissa/shared/enums/command.vk.enum';
import { Command, CommandModule } from '@bot-melissa/shared/schemas/command.schema';
import { Status, StatusModule } from '@bot-melissa/shared/schemas/status.schema';
import { User } from '@bot-melissa/shared/schemas/user.schema';

export const createStatus = async (statusNumber: number, chatId: number): Promise<Status> => {
  const status: Status = new StatusModule({
    chatId: chatId,
    status: statusNumber
  });
  return await status.save();
};

export const createCommand = async (command: CommandVkEnum, status: number, chatId: number): Promise<Command> => {
  const _command: Command = new CommandModule(<Command>{
    chatId: chatId,
    command: command,
    status: status
  });
  return await _command.save();
};

export const accessCheck = async (user: User, command: CommandVkEnum, chatId: number): Promise<boolean> => {
  const infoCommand: Command = await CommandModule.findOne({ chatId: chatId, command: command });
  return (user?.status || 0) >= (infoCommand?.status || 0);
};
