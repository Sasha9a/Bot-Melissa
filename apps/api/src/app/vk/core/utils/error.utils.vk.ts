import { stringifyMention } from "@bot-sadvers/api/vk/module/user/user.utils.vk";
import { ContextDefaultState, MessageContext } from "vk-io";

export async function errorSend(req: MessageContext<ContextDefaultState>, text: string) {
  req.send(`⛔ ${await stringifyMention(req.senderId)}: ${text}`).catch(console.error);
}
