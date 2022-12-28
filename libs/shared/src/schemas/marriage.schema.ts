import { Document, model, Schema } from 'mongoose';

export interface Marriage extends Document {
  chatId: number;
  marriageDate: Date;
  userFirstId: number;
  userSecondId: number;
  isConfirmed: boolean;
  status: number;
  messageId: number;
  checkDate: Date;
}

const MarriageSchema: Schema = new Schema<Marriage>(
  {
    chatId: { type: Number, required: true },
    marriageDate: Date,
    userFirstId: { type: Number, required: true },
    userSecondId: { type: Number, required: true },
    isConfirmed: { type: Boolean, default: false },
    status: { type: Number, default: 0 },
    messageId: Number,
    checkDate: Date
  },
  { versionKey: false }
);

export const MarriageModule = model<Marriage>('Marriage', MarriageSchema);
