import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, model } from "mongoose";
import * as mongoose from 'mongoose';

@Schema({ versionKey: false })
export class Chat extends Document {

  @Prop({ required: true })
  public chatId: number;

  @Prop()
  public rules: string;

  @Prop()
  public greetings: string;

  @Prop()
  public autoKickList: number[];

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  public banList: { id: number, endDate: Date }[];

}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export const ChatModule = model<Chat>('Chat', ChatSchema);
