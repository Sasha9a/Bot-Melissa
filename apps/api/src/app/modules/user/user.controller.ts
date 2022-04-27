import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { Response } from 'express';
import * as passport from "passport";

@Controller('user')
export class UserController {

  @Get('/auth/vkontakte/callback')
  public async getAuthVKCallback(@Res() res: Response) {
    passport.authenticate('vkontakte', {
      successRedirect: '/',
      failureRedirect: '/login'
    });
    return res.status(HttpStatus.OK).end();
  }

  @Get('/auth/vkontakte')
  public async getAuthVK(@Res() res: Response) {
    passport.authenticate('vkontakte');
    return res.status(HttpStatus.OK).end();
  }

}
