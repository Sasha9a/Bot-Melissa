import { Status, StatusModule } from "@bot-sadvers/shared/schemas/status.schema";

export async function createStatus(statusNumber: number, chatId: number): Promise<Status> {
  const status: Status = new StatusModule({
    chatId: chatId,
    status: statusNumber
  });
  return await status.save();
}
