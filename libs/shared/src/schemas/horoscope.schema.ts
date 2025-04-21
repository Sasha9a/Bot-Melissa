import { Document, model, Schema } from 'mongoose';

export interface Horoscope extends Document {
  date: Date;
  zodiacSign: string;
  text: string;
}

const HoroscopeSchema: Schema = new Schema<Horoscope>(
  {
    date: { type: Date, required: true },
    zodiacSign: { type: String, required: true },
    text: { type: String, required: true }
  },
  { versionKey: false }
);

export const HoroscopeModule = model<Horoscope>('Horoscope', HoroscopeSchema);
