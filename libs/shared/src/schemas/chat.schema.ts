import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, model } from "mongoose";

@Schema({ versionKey: false })
export class Chat extends Document {

  @Prop({ required: true })
  public chatId: number;

  @Prop()
  public rules: string;

  @Prop()
  public greetings: string;

}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export const ChatModule = model<Chat>('Chat', ChatSchema);
