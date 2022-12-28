import { TypeMarriagesEnum } from '@bot-melissa/shared/enums/type.marriages.enum';
import { Document, model, Schema } from 'mongoose';

export interface Chat extends Document {
  chatId: number;
  rules: string;
  greetings: string;
  autoKickList: number[];
  banList: { id: number; endDate: Date }[];
  muteList: { id: number; endDate: Date }[];
  maxWarn: number;
  typeMarriages: TypeMarriagesEnum;
  autoKickInDays: number;
  autoKickInDaysDate: Date;
  autoKickToStatus: number;
  isInvite: boolean;
}

const ChatSchema: Schema = new Schema<Chat>(
  {
    chatId: { type: Number, required: true },
    rules: String,
    greetings: String,
    autoKickList: [Number],
    banList: [{ id: Number, endDate: Date }],
    muteList: [{ id: Number, endDate: Date }],
    maxWarn: Number,
    typeMarriages: { type: Number, default: TypeMarriagesEnum.traditional },
    autoKickInDays: { type: Number, default: 0 },
    autoKickInDaysDate: Date,
    autoKickToStatus: { type: Number, default: 9 },
    isInvite: { type: Boolean, default: true }
  },
  { versionKey: false }
);

export const ChatModule = model<Chat>('Chat', ChatSchema);
