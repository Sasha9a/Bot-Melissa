import { BaseService } from "@bot-sadvers/api/core/services/base.service";
import { User } from "@bot-sadvers/shared/schemas/user.schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class UserService extends BaseService<User> {

  public constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    super(userModel);
  }

}
