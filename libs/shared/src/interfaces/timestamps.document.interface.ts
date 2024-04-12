import { Document } from 'mongoose';

export interface TimestampsDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}
