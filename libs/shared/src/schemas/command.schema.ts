import { CommandVkEnum } from '@bot-melissa/shared/enums/command.vk.enum';
import { Document, model, Schema } from 'mongoose';

export interface Command extends Document {
  chatId: number;
  command: CommandVkEnum;
  status: number;
}

const CommandSchema: Schema = new Schema<Command>(
  {
    chatId: { type: Number, required: true },
    command: { type: String, required: true, enum: Object.values(CommandVkEnum) },
    status: Number
  },
  { versionKey: false }
);

export const CommandModule = model<Command>('Command', CommandSchema);
