import { UserService } from "@bot-melissa/api/modules/user/user.service";
import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from 'express';

@Controller('user')
export class UserController {

  public constructor(private readonly userService: UserService) {
  }

  @Post('/login')
  public async login(@Res() res: Response, @Body() body: any) {
    console.log(body);
  }

}
