import { PeerTypeVkEnum } from "@bot-sadvers/api/vk/core/enums/peer.type.vk.enum";
import { RequestMessageVkModel } from "@bot-sadvers/api/vk/core/models/request.message.vk.model";
import { errorSend } from "@bot-sadvers/api/vk/core/utils/customMessage.utils.vk";
import { createCommand, createStatus } from "@bot-sadvers/api/vk/module/status/status.utils.vk";
import { CommandVkEnum } from "@bot-sadvers/shared/enums/command.vk.enum";
import { Command, CommandModule } from "@bot-sadvers/shared/schemas/command.schema";
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

export async function setCommandStatus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nДоступ [номер статуса] [команда]');
    }
    if (isNaN(Number(req.text[0])) || Number(req.text[0]) < 0 || Number(req.text[0]) > 10) {
      return errorSend(req.msgObject, 'Первый аргумент не верный');
    }
    const commandName = Object.values(CommandVkEnum).find((comm) => comm === req.fullText.substring(req.fullText.indexOf(req.text[1])));
    if (!commandName) {
      return errorSend(req.msgObject, 'Нет такой команды');
    }
    let command: Command = await CommandModule.findOne({ chatId: req.msgObject.peerId, command: commandName });
    if (!command) {
      command = await createCommand(commandName, Number(req.text[0]), req.msgObject.peerId);
    } else {
      command.status = Number(req.text[0]);
      await command.save();
    }
    req.msgObject.send(`Установлен доступ к команде "${command.command}" от статуса ${Number(req.text[0])}`).catch(console.error);
  }
}

export async function getCommandsStatus(req: RequestMessageVkModel) {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Доступы команд:';
    const commandArray = Object.values(CommandVkEnum);
    for (const _comm of commandArray) {
      const command: Command = await CommandModule.findOne({ chatId: req.msgObject.peerId, command: _comm });
      result = result.concat(`\n${_comm} - (${command?.status || 0})`);
    }
    req.msgObject.send(result).catch(console.error);
  }
}
