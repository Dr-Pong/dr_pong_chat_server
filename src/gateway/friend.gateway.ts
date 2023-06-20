import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserFactory } from 'src/domain/factory/user.factory';
import { FriendRepository } from 'src/domain/friend/friend.repository';
import { getTokenFromSocket } from './notification.gateway';
import { UserModel } from 'src/domain/factory/model/user.model';
import { Friend } from 'src/domain/friend/friend.entity';
import { checkUserExist } from 'src/domain/channel/validation/errors.channel';

export class FriendGateWay implements OnGatewayConnection {
  constructor(
    private readonly tokenService: JwtService,
    private readonly userFactory: UserFactory,
    private readonly friendRepository: FriendRepository,
  ) {}

  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const userId = this.tokenService.verify(getTokenFromSocket(socket))?.id;

    const user: UserModel = this.userFactory.findById(userId);
    checkUserExist(user);

    await this.getFriendsStatus(user);
  }

  async getFriendsStatus(user: UserModel): Promise<void> {
    const friends: Friend[] = await this.friendRepository.findFriendsByUserId(
      user.id,
    );

    const friendStatus = [];

    friends.forEach((c) => {
      const friend: UserModel = this.userFactory.findById(c.id);
      friendStatus.push({ nickname: friend.nickname, status: friend.status });
    });
    user.socket.emit('friends', friendStatus);
  }
}
