import { stringifyMention } from '@bot-melissa/app/module/user/user.utils.vk';
import { ContextDefaultState, MessageContext } from 'vk-io';

export const errorSend = async (req: MessageContext<ContextDefaultState>, text: string) => {
  req.send(`⛔ ${await stringifyMention({ userId: req.senderId })}: ${text}`, { disable_mentions: true }).catch(console.error);
};

export const yesSend = async (req: MessageContext<ContextDefaultState>, text: string, disable_mentions = true) => {
  req.send(`✅ ${text}`, { disable_mentions: disable_mentions }).catch(console.error);
};
