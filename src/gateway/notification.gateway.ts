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
import {
  USERSTATUS_OFFLINE,
  UserStatusType,
} from 'src/global/type/type.user.status';
import { Friend } from 'src/domain/friend/friend.entity';
import { GATEWAY_FRIEND, GATEWAY_NOTIFICATION } from './type/type.gateway';
import { getUserFromSocket } from 'src/global/utils/socket.utils';
import { ChannelInviteModel } from 'src/domain/factory/model/channel.invite.model';
import { GameInviteModel } from 'src/domain/factory/model/game.invite.model';
import { GameInvitation } from 'src/domain/invitation/dto/game.invite.list.dto';

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
    const user: UserModel = getUserFromSocket(socket, this.userFactory);
    if (!user) {
      console.log('user not found', socket.id);
      // socket.disconnect();
      return;
    }

    if (user.socket[GATEWAY_NOTIFICATION]?.size >= 5) {
      socket.disconnect();
      return;
    }

    this.sockets.set(socket.id, user.id);
    this.userFactory.setSocket(user.id, GATEWAY_NOTIFICATION, socket);

    await this.sendStatusToFriends(user.id, user.status);
    if (user.playingGame?.id) {
      user.socket[GATEWAY_NOTIFICATION]?.forEach((socket: Socket) => {
        socket?.emit('isInGame', {
          roomId: user.playingGame.id,
          gameType: user.playingGame.type,
        });
      });
    }
  }

  /**
   * '' 네임스페이스에서 연결이 끊어졌을 때 실행되는 메서드입니다.
   * 네임스페이스에서 연결이 끊어지면 친구들에게 자신의 상태를 알립니다. (offline)
   */
  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = this.userFactory.findById(
      this.sockets.get(socket.id),
    );
    await this.sendStatusToFriends(user.id, USERSTATUS_OFFLINE);
    this.userFactory.deleteSocket(user.id, GATEWAY_NOTIFICATION, socket);
    this.sockets.delete(socket.id);
  }

  /**
   * 친구 요청을 받았을 때 실행되는 메서드입니다.
   * 친구 요청을 받았다는 알림을 받기 위해서는 '' 네임스페이스에 연결되어 있어야 합니다.
   */
  async friendNotice(targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);
    target.socket[GATEWAY_NOTIFICATION]?.forEach((socket: Socket) => {
      socket?.emit('friend', {});
    });
  }

  /**
   * 새로운 dm을 받았을 때 실행되는 메서드입니다.
   * 현재 채팅인 상대의 dm으로는 알림을 받지 않습니다.
   * 알림을 받기 위해서는 '' 네임스페이스에 연결되어 있어야 합니다.
   */
  async newChatNotice(userId: number, targetId: number): Promise<void> {
    const target: UserModel = this.userFactory.findById(targetId);
    if (target.directMessageFriendId !== userId) {
      target.socket[GATEWAY_NOTIFICATION]?.forEach((socket: Socket) => {
        socket?.emit('newChat', {});
      });
    }
  }

  /**
   * 유저를 채널에 초대하는 함수입니다.
   * 유저가 접속해 있다면, notification 네임스페이스에 연결된 소켓으로 초대 메시지를 보냅니다.
   * 유저가 접속해 있지 않다면, 초대 메시지를 보내지 않습니다.
   */
  async inviteChannel(targetId: number, invite: ChannelInviteModel) {
    const target: UserModel = this.userFactory.findById(targetId);
    target.socket[GATEWAY_NOTIFICATION]?.forEach((socket: Socket) => {
      socket?.emit('invite', invite);
    });
    this.userFactory.inviteChannel(target.id, invite);
  }

  async inviteGame(senderId: number, invite: GameInviteModel) {
    const sender: UserModel = this.userFactory.findById(senderId);
    const receiver: UserModel = this.userFactory.findById(invite.receiverId);
    const gameInvitation: GameInvitation = new GameInvitation(
      invite.id,
      sender.nickname,
    );
    receiver.socket[GATEWAY_NOTIFICATION]?.forEach((socket: Socket) => {
      socket?.emit('invite', gameInvitation);
    });
    this.userFactory.inviteGame(senderId, receiver.id, invite);
  }

  async deleteGameInvite(senderId: number) {
    const sender: UserModel = this.userFactory.findById(senderId);
    const receiver: UserModel = this.userFactory.findById(
      sender?.gameInvite?.receiverId,
    );
    if (!sender || !receiver) return;
    sender.socket[GATEWAY_NOTIFICATION]?.forEach((socket: Socket) => {
      socket?.emit('deleteInvite', {});
    });
    receiver.socket[GATEWAY_NOTIFICATION]?.forEach((socket: Socket) => {
      socket?.emit('deleteInvite', {});
    });
    this.userFactory.deleteGameInviteBySenderId(sender.id);
  }

  /**
   * 친구 상태를 친구들에게 알리는 메서드입니다.
   * 현재 friend namespace에 연결된 모든 자신의 친구들에게 자신의 상태를 알립니다.
   */
  async sendStatusToFriends(
    userId: number,
    status: UserStatusType,
  ): Promise<void> {
    const user: UserModel = this.userFactory.findById(userId);
    const friends: Friend[] = await this.friendRepository.findFriendsByUserId(
      user.id,
    );

    const data: { [key: string]: UserStatusType } = {};
    data[user.nickname] = status;
    for (const c of friends) {
      const friendId: number =
        c.sender.id === user.id ? c.receiver.id : c.sender.id;
      const friend: UserModel = this.userFactory.findById(friendId);
      friend?.socket[GATEWAY_FRIEND]?.forEach((socket: Socket) => {
        socket?.emit('friends', data);
      });
    }
  }
}
