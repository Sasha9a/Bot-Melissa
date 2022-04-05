import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, model } from "mongoose";

@Schema({ versionKey: false })
export class Command extends Document {

  @Prop({ required: true })
  public chatId: number;

  @Prop({ required: true, type: String })
  public command: CommandVkEnum;

  @Prop()
  public status: number;

}

export const CommandSchema = SchemaFactory.createForClass(Command);
export const CommandModule = model<Command>('Command', CommandSchema);
