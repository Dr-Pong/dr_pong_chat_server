import {
  ConnectedSocket,
  OnGatewayConnection,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserFactory } from 'src/domain/factory/user.factory';
import { FriendRepository } from 'src/domain/friend/friend.repository';
import { getUserFromSocket } from './notification.gateway';
import { UserModel } from 'src/domain/factory/model/user.model';
import { Friend } from 'src/domain/friend/friend.entity';
import { UserStatusType } from 'src/global/type/type.user.status';
import { GATEWAY_FRIEND } from './type/type.gateway';

@WebSocketGateway({ namespace: 'friends' })
export class FriendGateWay implements OnGatewayConnection {
  constructor(
    private readonly userFactory: UserFactory,
    private readonly friendRepository: FriendRepository,
  ) {}

  /**
   * 'friends' 네임스페이스에 연결되었을 때 실행되는 메서드입니다.
   * 유저가 이미 네임스페이스에 연결된 소켓을 가지고 있다면, 이전 소켓을 끊고 새로운 소켓으로 교체합니다.
   * 유저가 친구들의 상태를 받아오려면 네임스페이스에 연결되어 있어야 합니다.
   */
  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = getUserFromSocket(socket, this.userFactory);
    if (!user) {
      socket.disconnect();
      return;
    }
    if (user.socket && user.socket[GATEWAY_FRIEND]?.id !== socket?.id) {
      user.socket[GATEWAY_FRIEND]?.disconnect();
    }
    this.userFactory.setSocket(user.id, GATEWAY_FRIEND, socket);

    await this.getFriendsStatus(user.id);
  }

  /**
   * namespace에 최초 연결시, 기존에 접속해 있던 친구들의 상태를 받아오는 메서드입니다.
   */
  async getFriendsStatus(userId: number): Promise<void> {
    const user: UserModel = this.userFactory.findById(userId);
    const friends: Friend[] = await this.friendRepository.findFriendsByUserId(
      userId,
    );

    const data: { [key: string]: UserStatusType } = {};

    friends.forEach((c) => {
      const friendId: number =
        c.sender.id === user.id ? c.receiver.id : c.sender.id;
      const friend: UserModel = this.userFactory.findById(friendId);
      data[friend.nickname] = friend.status;
    });
    user.socket[GATEWAY_FRIEND]?.emit('friends', data);
  }
}
