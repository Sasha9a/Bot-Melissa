import { Document, model, Schema } from 'mongoose';

export interface Status extends Document {
  chatId: number;
  status: number;
  name: string;
}

const StatusSchema: Schema = new Schema<Status>(
  {
    chatId: { type: Number, required: true },
    status: { type: Number, required: true },
    name: String
  },
  { versionKey: false }
);

export const StatusModule = model<Status>('Status', StatusSchema);
