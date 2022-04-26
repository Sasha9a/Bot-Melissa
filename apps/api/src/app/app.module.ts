import { UserModule } from "@bot-melissa/api/modules/user/user.module";
import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { environment } from "../environments/environment";

@Module({
  imports: [
    MongooseModule.forRoot(environment.db, {
      connectionFactory: (connection) => {
        connection.plugin(require('mongoose-autopopulate'));
        return connection;
      }
    }),
    UserModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
