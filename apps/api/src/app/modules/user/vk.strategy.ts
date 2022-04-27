import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Params, Profile, Strategy, VerifyCallback } from "passport-vkontakte";

@Injectable()
export class VKStrategy extends PassportStrategy(Strategy, "vkontakte") {
  public constructor() {
    super({
      clientID: 8150888,
      clientSecret: 'm1mCy3nf5Qj5GtglFops',
      callbackURL: 'http://localhost:3000/user/auth/vkontakte/callback',
      lang: 'ru',
      apiVersion: '5.131'
    }, (accessToken: string, refreshToken: string, params: Params, profile: Profile, done: VerifyCallback) => {
      return done(null, profile);
    });
  }
}
