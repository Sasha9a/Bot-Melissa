import { JwtAuthGuard } from "@bot-melissa/api/core/guards/jwt-auth.guard";
import { JwtStrategy } from "@bot-melissa/api/modules/user/jwt.strategy";
import { UserController } from "@bot-melissa/api/modules/user/user.controller";
import { UserService } from "@bot-melissa/api/modules/user/user.service";
import { User, UserSchema } from "@bot-melissa/shared/schemas/user.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy, JwtAuthGuard],
  exports: [UserService]
})
export class UserModule {}
