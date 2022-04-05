import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, model } from "mongoose";

@Schema({ versionKey: false })
export class Status extends Document {

  @Prop({ required: true })
  public chatId: number;

  @Prop({ required: true })
  public status: number;

  @Prop()
  public name: string;

}

export const StatusSchema = SchemaFactory.createForClass(Status);
export const StatusModule = model<Status>('Status', StatusSchema);
