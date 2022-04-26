import { CommandVkEnum } from "@bot-melissa/shared/enums/command.vk.enum";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, model } from "mongoose";

@Schema({ versionKey: false })
export class Antispam extends Document {

  @Prop({ required: true })
  public chatId: number;

  @Prop({ required: true, type: String })
  public command: CommandVkEnum;

  @Prop({ required: true })
  public date: Date;

  @Prop()
  public peerId: number;

  @Prop()
  public question: string;

  @Prop()
  public text: string;

}

export const AntispamSchema = SchemaFactory.createForClass(Antispam);
export const AntispamModule = model<Antispam>('Antispam', AntispamSchema);
