import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserFactory } from 'src/domain/factory/user.factory';
import { FriendRepository } from 'src/domain/friend/friend.repository';
import { UserModel } from 'src/domain/factory/model/user.model';
import { Friend } from 'src/domain/friend/friend.entity';
import { UserStatusType } from 'src/global/type/type.user.status';
import { GATEWAY_FRIEND } from './type/type.gateway';
import { IsolationLevel, Transactional } from 'typeorm-transactional';
import {
  getUserFromSocket,
  sendToAllSockets,
} from 'src/global/utils/socket.utils';

@WebSocketGateway({ namespace: 'friends' })
export class FriendGateWay implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly userFactory: UserFactory,
    private readonly friendRepository: FriendRepository,
  ) {}
  @WebSocketServer()
  server: Server;

  /**
   * 'friends' 네임스페이스에 연결되었을 때 실행되는 메서드입니다.
   * 유저가 이미 네임스페이스에 연결된 소켓을 가지고 있다면, 이전 소켓을 끊고 새로운 소켓으로 교체합니다.
   * 유저가 친구들의 상태를 받아오려면 네임스페이스에 연결되어 있어야 합니다.
   */
  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = await getUserFromSocket(socket, this.userFactory);
    if (!user) {
      socket.disconnect();
      return;
    }
    if (user.friendSocket?.size >= 5) {
      socket.disconnect();
      return;
    }

    this.userFactory.setSocket(user.id, GATEWAY_FRIEND, socket);

    await this.getFriendsStatus(user.id);
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = await getUserFromSocket(socket, this.userFactory);
    if (!user) {
      return;
    }
    this.userFactory.deleteSocket(user.id, GATEWAY_FRIEND, socket);
  }

  @SubscribeMessage('status')
  @Transactional({ isolationLevel: IsolationLevel.READ_UNCOMMITTED })
  async emitFriendStatus(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = await getUserFromSocket(socket, this.userFactory);
    if (!user) return;

    const friends: Friend[] = await this.friendRepository.findFriendsByUserId(
      user.id,
    );

    const data: { [key: string]: UserStatusType } = {};

    friends.forEach((c) => {
      const friendId: number =
        c.sender.id === user.id ? c.receiver.id : c.sender.id;
      const friend: UserModel = this.userFactory.findById(friendId);
      data[friend.nickname] = friend.status;
    });
    sendToAllSockets(user.friendSocket, this.server, 'friends', data);
    // user.friendSocket?.forEach((socket: Socket) => {
    //   socket?.emit('friends', data);
    // });
  }

  /**
   * namespace에 최초 연결시, 기존에 접속해 있던 친구들의 상태를 받아오는 메서드입니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.READ_UNCOMMITTED })
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
    sendToAllSockets(user.friendSocket, this.server, 'friends', data);
    // user.friendSocket?.forEach((socket: Socket) => {
    //   socket?.emit('friends', data);
    // });
  }

  async friendNotice(targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);
    sendToAllSockets(target.friendSocket, this.server, 'friend', {});
    // target.friendSocket?.forEach((socket: Socket) => {
    //   socket?.emit('friend', {});
    // });
  }
}
