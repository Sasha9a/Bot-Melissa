import * as moment from 'moment-timezone';
import { Document, model, Schema } from 'mongoose';

export interface User extends Document {
  chatId: number;
  peerId: number;
  joinDate: Date;
  status: number;
  nick: string;
  icon: string;
  age: number;
  aboutMe: string;
  warn: number;
  lastActivityDate: Date;
}

const UserSchema: Schema = new Schema<User>(
  {
    chatId: { type: Number, required: true },
    peerId: { type: Number, required: true },
    joinDate: { type: Date, default: moment().toDate() },
    status: { type: Number, default: 0 },
    nick: String,
    icon: String,
    age: Number,
    aboutMe: String,
    warn: { type: Number, default: 0 },
    lastActivityDate: Date
  },
  { versionKey: false }
);

export const UserModule = model<User>('User', UserSchema);
