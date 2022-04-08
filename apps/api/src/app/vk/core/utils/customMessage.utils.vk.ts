import { stringifyMention } from "@bot-sadvers/api/vk/module/user/user.utils.vk";
import { ContextDefaultState, MessageContext } from "vk-io";

export async function errorSend(req: MessageContext<ContextDefaultState>, text: string) {
  req.send(`⛔ ${await stringifyMention(req.senderId)}: ${text}`, { disable_mentions: true }).catch(console.error);
}

export async function yesSend(req: MessageContext<ContextDefaultState>, text: string, disable_mentions = true) {
  req.send(`✅ ${text}`, { disable_mentions: disable_mentions }).catch(console.error);
}
