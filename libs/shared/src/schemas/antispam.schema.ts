import { CommandVkEnum } from '@bot-melissa/shared/enums/command.vk.enum';
import { Document, model, Schema } from 'mongoose';

export interface Antispam extends Document {
  chatId: number;
  command: CommandVkEnum;
  date: Date;
  peerId: number;
  question: string;
  text: string;
}

const AntispamSchema: Schema = new Schema<Antispam>(
  {
    chatId: { type: Number, required: true },
    command: { type: String, required: true, enum: Object.values(CommandVkEnum) },
    date: { type: Date, required: true },
    peerId: Number,
    question: String,
    text: String
  },
  { versionKey: false }
);

export const AntispamModule = model<Antispam>('Antispam', AntispamSchema);
