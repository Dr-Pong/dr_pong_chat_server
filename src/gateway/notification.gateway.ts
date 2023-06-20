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
} from 'src/global/type/type.user.status';
import { Friend } from 'src/domain/friend/friend.entity';
import { checkUserExist } from 'src/domain/channel/validation/errors.channel';

@WebSocketGateway()
export class NotificationGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly userFactory: UserFactory,
    private readonly tokenService: JwtService,
    private readonly friendRepository: FriendRepository,
  ) {}
  private sockets: Map<string, UserModel> = new Map();

  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const userId = this.tokenService.verify(getTokenFromSocket(socket))?.id;

    const user: UserModel = this.userFactory.findById(userId);
    checkUserExist(user);

    if (user.socket && user.socket?.id !== socket?.id) {
      user.socket.disconnect();
    }

    this.sockets.set(socket.id, user);
    user.socket = socket;

    await this.sendOnlineStatusToFriends(user);
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = this.sockets.get(socket.id);
    this.userFactory.setSocket(user.id, null);
    this.userFactory.setStatus(user.id, USERSTATUS_OFFLINE);
    this.sockets.delete(socket.id);
  }

  async friendNotice(targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);
    if (target.socket) {
      target.socket.emit('friend', {});
    }
  }

  async newChatNotice(targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);
    if (target.socket) {
      target.socket.emit('newChat', {});
    }
  }

  async sendOnlineStatusToFriends(user: UserModel): Promise<void> {
    const friends: Friend[] = await this.friendRepository.findFriendsByUserId(
      user.id,
    );

    for (const c of friends) {
      const friend: UserModel = this.userFactory.findById(c.id);
      if (friend.socket) {
        friend.socket.emit('friends', {
          nickname: user.nickname,
          status: USERSTATUS_ONLINE,
        });
      }
    }
  }
}

export function getTokenFromSocket(socket: Socket): string {
  return socket.handshake.auth?.Authorization?.split(' ')[1] ?? null;
}
