import { UserService } from "@bot-sadvers/api/modules/user/user.service";
import { User, UserSchema } from "@bot-sadvers/shared/schemas/user.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
