import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/error.utils.vk";
import { createStatus } from "@bot-sadvers/api/vk/module/status/status.utils.vk";
import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";

export async function setNameStatus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nНазвание статуса [номер статуса] [название]');
    }
    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 0 || Number(req.text[0]) > 10) {
      return errorSend(req.msgObject, 'Первый аргумент не верный');
    }
    let status: Status = await StatusModule.findOne({ chatId: req.msgObject.peerId, status: Number(req.text[0]) });
    if (!status) {
      status = await createStatus(Number(req.text[0]), req.msgObject.peerId);
    }
    status.name = req.fullText.substring(req.fullText.indexOf(req.text[1]));
    await status.save();
    req.msgObject.send(`Установлено название статуса "${status.name}" для статуса ${Number(req.text[0])}`).catch(console.error);
  }
}
