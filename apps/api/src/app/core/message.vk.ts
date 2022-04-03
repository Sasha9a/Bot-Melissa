import { getUser, setIcon, setNick } from "@bot-sadvers/api/modules/user/user.vk";
import { ContextDefaultState, MessageContext } from "vk-io";

export function parseMessage(message: MessageContext<ContextDefaultState>) {
  if (message.text.toLowerCase().startsWith('мне ник')) {
    setNick(message).catch(console.error);
  } else if (message.text.toLowerCase().startsWith('кто я')) {
    getUser(message).catch(console.error);
  } else if (message.text.toLowerCase().startsWith('мне значок')) {
    setIcon(message).catch(console.error);
  }
}
