import { UserService } from "@bot-melissa/api/modules/user/user.service";
import { User, UserSchema } from "@bot-melissa/shared/schemas/user.schema";
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
