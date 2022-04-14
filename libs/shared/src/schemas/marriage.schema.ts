import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, model } from "mongoose";

@Schema({ versionKey: false })
export class Marriage extends Document {

  @Prop({ required: true })
  public chatId: number;

  @Prop()
  public marriageDate: Date;

  @Prop({ required: true })
  public userFirstId: number;

  @Prop({ required: true })
  public userSecondId: number;

  @Prop({ default: false })
  public isConfirmed: boolean;

  @Prop({ default: 0 })
  public status: number;

  @Prop()
  public checkDate: Date;

}

export const MarriageSchema = SchemaFactory.createForClass(Marriage);
export const MarriageModule = model<Marriage>('Marriage', MarriageSchema);
