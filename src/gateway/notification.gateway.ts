import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserFactory } from 'src/domain/factory/user.factory';
import { UserModel } from 'src/domain/factory/model/user.model';
import { JwtService } from '@nestjs/jwt';
import { FriendRepository } from 'src/domain/friend/friend.repository';
import {
  USERSTATUS_OFFLINE,
  USERSTATUS_ONLINE,
  UserStatusType,
} from 'src/global/type/type.user.status';
import { Friend } from 'src/domain/friend/friend.entity';
import { GATEWAY_FRIEND, GATEWAY_NOTIFICATION } from './type/type.gateway';

@WebSocketGateway({ namespace: '' })
export class NotificationGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly userFactory: UserFactory,
    private readonly friendRepository: FriendRepository,
  ) {}
  private sockets: Map<string, UserModel> = new Map();

  /**
   * '' 네임스페이스에 연결되었을 때 실행되는 메서드입니다.
   * 유저가 이미 네임스페이스에 연결된 소켓을 가지고 있다면, 이전 소켓을 끊고 새로운 소켓으로 교체합니다.
   * 네임스페이스에 연결되면 친구들에게 자신의 상태를 알립니다. (online)
   * 알림을 받기 위해서는 네임스페이스에 연결되어 있어야 합니다.
   */
  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = getUserFromSocket(socket, this.userFactory);
    if (!user) {
      socket.disconnect();
      return;
    }

    if (
      user.socket &&
      user.socket.get(GATEWAY_NOTIFICATION)?.id !== socket?.id
    ) {
      user.socket[GATEWAY_NOTIFICATION]?.disconnect();
    }

    this.sockets.set(socket.id, user);
    this.userFactory.setSocket(user.id, GATEWAY_NOTIFICATION, socket);

    await this.sendStatusToFriends(user, USERSTATUS_ONLINE);
  }

  /**
   * '' 네임스페이스에서 연결이 끊어졌을 때 실행되는 메서드입니다.
   * 네임스페이스에서 연결이 끊어지면 친구들에게 자신의 상태를 알립니다. (offline)
   */
  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = this.sockets.get(socket.id);
    await this.sendStatusToFriends(user, USERSTATUS_OFFLINE);
    this.userFactory.setSocket(user.id, GATEWAY_NOTIFICATION, null);
    this.sockets.delete(socket.id);
  }

  /**
   * 친구 요청을 받았을 때 실행되는 메서드입니다.
   * 친구 요청을 받았다는 알림을 받기 위해서는 '' 네임스페이스에 연결되어 있어야 합니다.
   */
  async friendNotice(targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);
    target.socket[GATEWAY_NOTIFICATION]?.emit('friend', {});
  }

  /**
   * 새로운 dm을 받았을 때 실행되는 메서드입니다.
   * 알림을 받기 위해서는 '' 네임스페이스에 연결되어 있어야 합니다.
   */
  async newChatNotice(targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);
    target.socket[GATEWAY_NOTIFICATION]?.emit('newChat', {});
  }

  /**
   * 친구 상태를 친구들에게 알리는 메서드입니다.
   * 현재 friend namespace에 연결된 모든 자신의 친구들에게 자신의 상태를 알립니다.
   */
  async sendStatusToFriends(
    user: UserModel,
    status: UserStatusType,
  ): Promise<void> {
    const friends: Friend[] = await this.friendRepository.findFriendsByUserId(
      user.id,
    );

    for (const c of friends) {
      const friendId: number =
        c.sender.id === user.id ? c.receiver.id : c.sender.id;
      const friend: UserModel = this.userFactory.findById(friendId);
      const data: { [key: string]: UserStatusType } = {};
      data[user.nickname] = status;
      friend?.socket[GATEWAY_FRIEND]?.emit('friends', data);
    }
  }
}

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
    secret: 'jwtSecret',
    signOptions: {
      expiresIn: 60 * 60 * 60,
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
    console.log(e);
    return null;
  }
}
