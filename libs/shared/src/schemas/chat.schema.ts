import { TypeMarriagesEnum } from "@bot-melissa/shared/enums/type.marriages.enum";
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

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  public muteList: { id: number, endDate: Date }[];

  @Prop()
  public maxWarn: number;

  @Prop({ type: Number, default: 0 })
  public typeMarriages: TypeMarriagesEnum;

  @Prop({ default: 0 })
  public autoKickInDays: number;

  @Prop()
  public autoKickInDaysDate: Date;

  @Prop({ default: 9 })
  public autoKickToStatus: number;

  @Prop({ default: true })
  public isInvite: boolean;

}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export const ChatModule = model<Chat>('Chat', ChatSchema);
