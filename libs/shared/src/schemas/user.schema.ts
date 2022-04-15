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

  @Prop({ default: 0 })
  public status: number;

  @Prop()
  public nick: string;

  @Prop()
  public icon: string;

  @Prop()
  public age: number;

  @Prop()
  public aboutMe: string;

  @Prop({ default: 0 })
  public warn: number;

  @Prop()
  public lastActivityDate: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModule = model<User>('User', UserSchema);
