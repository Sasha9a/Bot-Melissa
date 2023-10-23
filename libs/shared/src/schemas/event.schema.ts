import { Document, model, Schema } from 'mongoose';

export interface Event extends Document {
  chatId: number;
  name: string;
  createdUserId: number;
  eventDate: Date;
}

const EventSchema: Schema = new Schema<Event>(
  {
    chatId: { type: Number, required: true },
    name: { type: String, required: true },
    eventDate: { type: Date, required: true },
    createdUserId: { type: Number, required: true }
  },
  { versionKey: false }
);

export const EventModule = model<Event>('Event', EventSchema);
