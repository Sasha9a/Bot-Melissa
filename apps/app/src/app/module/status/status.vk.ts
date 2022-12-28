import { PeerTypeVkEnum } from '@bot-melissa/app/core/enums/peer.type.vk.enum';
import { RequestMessageVkModel } from '@bot-melissa/app/core/models/request.message.vk.model';
import { errorSend, yesSend } from '@bot-melissa/app/core/utils/customMessage.utils.vk';
import { createCommand, createStatus } from '@bot-melissa/app/module/status/status.utils.vk';
import { CommandVkEnum } from '@bot-melissa/shared/enums/command.vk.enum';
import { Command, CommandModule } from '@bot-melissa/shared/schemas/command.schema';
import { Status, StatusModule } from '@bot-melissa/shared/schemas/status.schema';

export const setNameStatus = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nЛиса название статуса [номер статуса] [название]');
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
    await yesSend(req.msgObject, `Установлено название статуса "${status.name}" для статуса ${Number(req.text[0])}`);
  }
};

export const setCommandStatus = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    if (req.text.length < 2) {
      return errorSend(req.msgObject, 'Не все параметры введены\nЛиса доступ [номер статуса] [команда]');
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
    await yesSend(req.msgObject, `Установлен доступ к команде "${command.command}" от статуса ${Number(req.text[0])}`);
  }
};

export const getCommandsStatus = async (req: RequestMessageVkModel) => {
  if (req.msgObject.peerType == PeerTypeVkEnum.CHAT) {
    let result = 'Доступы команд:';
    const commandArray = Object.values(CommandVkEnum);
    for (const _comm of commandArray) {
      if (_comm === CommandVkEnum.updateAll) {
        continue;
      }
      const command: Command = await CommandModule.findOne({ chatId: req.msgObject.peerId, command: _comm });
      result = result.concat(`\n${_comm} - (${command?.status || 0})`);
    }
    req.msgObject.send(result).catch(console.error);
  }
};
