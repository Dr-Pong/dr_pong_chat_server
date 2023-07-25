import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { UserModel } from 'src/domain/factory/model/user.model';
import { UserFactory } from 'src/domain/factory/user.factory';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * 소켓에서 유저를 가져오는 메서드입니다.
 * 소켓에 Authorization 헤더에 jwt 토큰이 담겨있어야 합니다.
 * 토큰이 없다면 null을 반환합니다.
 * 토큰이 있다면 토큰을 검증하고, 검증된 토큰에서 유저 아이디를 가져와서 유저를 반환합니다.
 * 토큰이 잘못된 경우에도 null을 반환합니다.
 *
 * jwtService를 주입받아서 사용할지 테스트가 필요합니다.
 */
export function getUserFromSocket(
  socket: Socket,
  userFactory: UserFactory,
): UserModel {
  const jwtService: JwtService = new JwtService({
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: +process.env.JWT_EXPIRATION_TIME,
    },
  });

  const accesstoken = socket.handshake.auth?.Authorization?.split(' ')[1];
  if (!accesstoken) {
    console.log('no token', socket.id);
    return null;
  }
  try {
    const userToken = jwtService.verify(accesstoken);
    const userId = userToken?.id;
    const user: UserModel = userFactory.findById(userId);
    return user;
  } catch (e) {
    console.log(accesstoken, e);
    return null;
  }
}
