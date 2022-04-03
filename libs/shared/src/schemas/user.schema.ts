import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, model } from 'mongoose';

@Schema({ versionKey: false })
export class User extends Document {

  @Prop({ required: true })
  public chatId: number;

  @Prop({ required: true })
  public peerId: number;

  @Prop()
  public nick: string;

  @Prop()
  public icon: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModule = model<User>('User', UserSchema);
