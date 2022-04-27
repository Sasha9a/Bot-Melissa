import { UserController } from "@bot-melissa/api/modules/user/user.controller";
import { UserService } from "@bot-melissa/api/modules/user/user.service";
import { VKStrategy } from "@bot-melissa/api/modules/user/vk.strategy";
import { User, UserSchema } from "@bot-melissa/shared/schemas/user.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [UserController],
  providers: [UserService, VKStrategy],
  exports: [UserService]
})
export class UserModule {}
