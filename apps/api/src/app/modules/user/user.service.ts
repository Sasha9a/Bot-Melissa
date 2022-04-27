import { BaseService } from "@bot-melissa/api/core/services/base.service";
import { User } from "@bot-melissa/shared/schemas/user.schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class UserService extends BaseService<User> {

  public constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    super(userModel);
  }

  public async findByPeerId(peerId: number): Promise<User> {
    return await this.userModel.findOne({ peerId: peerId }).exec();
  }

}
