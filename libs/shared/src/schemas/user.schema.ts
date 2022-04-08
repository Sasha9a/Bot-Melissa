import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, model } from 'mongoose';

@Schema({ versionKey: false })
export class User extends Document {

  @Prop({ required: true })
  public chatId: number;

  @Prop({ required: true })
  public peerId: number;

  @Prop()
  public joinDate: Date;

  @Prop({ required: true })
  public status: number;

  @Prop()
  public nick: string;

  @Prop()
  public icon: string;

  @Prop({ default: 0 })
  public warn: number;

  @Prop()
  public lastActivityDate: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModule = model<User>('User', UserSchema);
