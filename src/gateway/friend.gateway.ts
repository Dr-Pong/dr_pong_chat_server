import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserFactory } from 'src/domain/factory/user.factory';
import { FriendRepository } from 'src/domain/friend/friend.repository';
import { getTokenFromSocket } from './notification.gateway';
import { UserModel } from 'src/domain/factory/model/user.model';
import { Friend } from 'src/domain/friend/friend.entity';
import { USERSTATUS_ONLINE } from 'src/global/type/type.user.status';

export class FriendGateWay implements OnGatewayConnection {
  constructor(
    private readonly tokenService: JwtService,
    private readonly userFactory: UserFactory,
    private readonly friendRepository: FriendRepository,
  ) {}

  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const accessToken = this.tokenService.verify(getTokenFromSocket(socket));

    const { id } = accessToken;
    const user = this.userFactory.findById(id);
    const friends: Friend[] = await this.friendRepository.findFriendsByUserId(
      id,
    );

    const friendStatus = [];

    for (const c of friends) {
      const friend: UserModel = this.userFactory.findById(c.id);
      if (user.socket && friend.socket) {
        friend.socket.emit('friends', {
          nickname: user.nickname,
          status: USERSTATUS_ONLINE,
        });
        friendStatus.push({ nickname: friend.nickname, status: friend.status });
      }
    }
    socket.emit('friends', friendStatus);
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
