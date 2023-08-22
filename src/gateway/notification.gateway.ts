import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserFactory } from 'src/domain/factory/user.factory';
import { UserModel } from 'src/domain/factory/model/user.model';
import { FriendRepository } from 'src/domain/friend/friend.repository';
import { UserStatusType } from 'src/global/type/type.user.status';
import { Friend } from 'src/domain/friend/friend.entity';
import { GATEWAY_NOTIFICATION } from './type/type.gateway';
import {
  getUserFromSocket,
  sendToAllSockets,
} from 'src/global/utils/socket.utils';
import { ChannelInviteModel } from 'src/domain/factory/model/channel.invite.model';
import { GameInviteModel } from 'src/domain/factory/model/game.invite.model';
import { GameInvitation } from 'src/domain/invitation/dto/game.invite.list.dto';
import { IsolationLevel, Transactional } from 'typeorm-transactional';

@WebSocketGateway({ namespace: '' })
export class NotificationGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly userFactory: UserFactory,
    private readonly friendRepository: FriendRepository,
  ) {}
  private sockets: Map<string, number> = new Map();

  /**
   * '' 네임스페이스에 연결되었을 때 실행되는 메서드입니다.
   * 유저가 이미 네임스페이스에 연결된 소켓을 가지고 있다면, 이전 소켓을 끊고 새로운 소켓으로 교체합니다.
   * 네임스페이스에 연결되면 친구들에게 자신의 상태를 알립니다. (online)
   * 알림을 받기 위해서는 네임스페이스에 연결되어 있어야 합니다.
   */
  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = await getUserFromSocket(socket, this.userFactory);
    if (!user) {
      console.log('user not found', socket.id);
      // socket.disconnect();
      return;
    }

    if (user.notificationSocket?.size >= 5) {
      socket.disconnect();
      return;
    }

    this.userFactory.setSocket(user.id, GATEWAY_NOTIFICATION, socket);

    await this.sendStatusToFriends(user.id);
    if (user.playingGame?.id) {
      sendToAllSockets(user.notificationSocket, 'isInGame', {
        roomId: user.playingGame.id,
        gameType: user.playingGame.type,
      });
      // user.notificationSocket?.forEach((socket: Socket) => {
      //   socket?.emit('isInGame', {
      //     roomId: user.playingGame.id,
      //     gameType: user.playingGame.type,
      //   });
      // });
    }
  }

  /**
   * '' 네임스페이스에서 연결이 끊어졌을 때 실행되는 메서드입니다.
   * 네임스페이스에서 연결이 끊어지면 친구들에게 자신의 상태를 알립니다. (offline)
   */
  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = await getUserFromSocket(socket, this.userFactory);
    if (!user) {
      return;
    }
    this.userFactory.deleteSocket(user.id, GATEWAY_NOTIFICATION, socket);
    await this.sendStatusToFriends(user.id);
  }

  /**
   * 친구 요청을 받았을 때 실행되는 메서드입니다.
   * 친구 요청을 받았다는 알림을 받기 위해서는 '' 네임스페이스에 연결되어 있어야 합니다.
   */
  async friendNotice(targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);
    sendToAllSockets(target.notificationSocket, 'friend', {});
    // target.notificationSocket?.forEach((socket: Socket) => {
    //   socket?.emit('friend', {});
    // });
  }

  /**
   * 새로운 dm을 받았을 때 실행되는 메서드입니다.
   * 현재 채팅인 상대의 dm으로는 알림을 받지 않습니다.
   * 알림을 받기 위해서는 '' 네임스페이스에 연결되어 있어야 합니다.
   */
  async newChatNotice(userId: number, targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);

    let isChatting = false;
    target?.directMessageFriendId.forEach((id) => {
      if (id === userId) isChatting = true;
    });

    if (!isChatting) {
      sendToAllSockets(target.notificationSocket, 'newChat', {});
    }
    // if (target.directMessageFriendId !== userId) {
    //   target.notificationSocket?.forEach((socket: Socket) => {
    //     socket?.emit('newChat', {});
    //   });
    // }
  }

  /**
   * 유저를 채널에 초대하는 함수입니다.
   * 유저가 접속해 있다면, notification 네임스페이스에 연결된 소켓으로 초대 메시지를 보냅니다.
   * 유저가 접속해 있지 않다면, 초대 메시지를 보내지 않습니다.
   */
  async inviteChannel(targetId: number, invite: ChannelInviteModel) {
    const target: UserModel = this.userFactory.findById(targetId);
    sendToAllSockets(target.notificationSocket, 'invite', invite);
    // target.notificationSocket?.forEach((socket: Socket) => {
    //   socket?.emit('invite', invite);
    // });
    this.userFactory.inviteChannel(target.id, invite);
  }

  async inviteGame(senderId: number, invite: GameInviteModel) {
    const sender: UserModel = this.userFactory.findById(senderId);
    const receiver: UserModel = this.userFactory.findById(invite.receiverId);
    const gameInvitation: GameInvitation = new GameInvitation(
      invite.id,
      sender.nickname,
    );
    sendToAllSockets(receiver.notificationSocket, 'invite', gameInvitation);
    // receiver.notificationSocket?.forEach((socket: Socket) => {
    //   socket?.emit('invite', gameInvitation);
    // });
    this.userFactory.inviteGame(senderId, receiver.id, invite);
  }

  async deleteGameInvite(senderId: number) {
    const sender: UserModel = this.userFactory.findById(senderId);
    const receiver: UserModel = this.userFactory.findById(
      sender?.gameInvite?.receiverId,
    );
    if (!sender || !receiver) return;
    sendToAllSockets(sender.notificationSocket, 'deleteInvite', {});
    sendToAllSockets(receiver.notificationSocket, 'deleteInvite', {});
    // sender.notificationSocket?.forEach((socket: Socket) => {
    //   socket?.emit('deleteInvite', {});
    // });
    // receiver.notificationSocket?.forEach((socket: Socket) => {
    //   socket?.emit('deleteInvite', {});
    // });
    this.userFactory.deleteGameInviteBySenderId(sender.id);
  }

  /**
   * 친구 상태를 친구들에게 알리는 메서드입니다.
   * 현재 friend namespace에 연결된 모든 자신의 친구들에게 자신의 상태를 알립니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async sendStatusToFriends(userId: number): Promise<void> {
    const user: UserModel = this.userFactory.findById(userId);
    const friends: Friend[] = await this.friendRepository.findFriendsByUserId(
      user.id,
    );

    const data: { [key: string]: UserStatusType } = {};
    data[user.nickname] = user.status;
    for (const c of friends) {
      const friendId: number =
        c.sender.id === user.id ? c.receiver.id : c.sender.id;
      const friend: UserModel = this.userFactory.findById(friendId);
      sendToAllSockets(friend.friendSocket, 'friends', data);
      // friend?.friendSocket?.forEach((socket: Socket) => {
      //   socket?.emit('friends', data);
      // });
    }
  }
}
