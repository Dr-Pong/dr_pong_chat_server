import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelFactory } from 'src/domain/factory/channel.factory';
import { UserFactory } from 'src/domain/factory/user.factory';
import { UserModel } from 'src/domain/factory/model/user.model';
import {
  CHAT_JOIN,
  CHAT_MESSAGE,
  ChannelActionType,
} from 'src/domain/channel/type/type.channel.action';
import { MessageModel } from 'src/gateway/dto/message.model';
import {
  CHATTYPE_ME,
  CHATTYPE_OTHERS,
  CHATTYPE_SYSTEM,
} from 'src/global/type/type.chat';
import { GATEWAY_CHANNEL } from './type/type.gateway';
import { getUserFromSocket } from 'src/global/utils/socket.utils';
import { ChannelMessage } from 'src/domain/channel/entity/channel-message.entity';

@WebSocketGateway({ namespace: 'channel' })
export class ChannelGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly userFactory: UserFactory,
    private readonly channelFactory: ChannelFactory,
  ) {}
  @WebSocketServer()
  private readonly server: Server;
  private sockets: Map<string, number> = new Map();

  /**
   * 'channel' 네임스페이스에 연결되었을 때 실행되는 메서드입니다.
   *  유저가 이미 네임스페이스에 연결된 소켓을 가지고 있다면, 이전 소켓을 끊고 새로운 소켓으로 교체합니다.
   *  유저가 채널에 들어가 있었다면, 채널의 id와 같은 room에 소켓을 join합니다.
   */
  async handleConnection(@ConnectedSocket() socket: Socket) {
    const user: UserModel = getUserFromSocket(socket, this.userFactory);
    if (!user) {
      socket.disconnect();
      return;
    }
    if (user.socket[GATEWAY_CHANNEL]?.size >= 5) {
      socket.disconnect();
      return;
    }

    if (user.joinedChannel) {
      socket.join(user.joinedChannel);
    }
    this.sockets.set(socket.id, user.id);
    this.userFactory.setSocket(user.id, GATEWAY_CHANNEL, socket);
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const userId = this.sockets.get(socket.id);

    this.userFactory.deleteSocket(userId, GATEWAY_CHANNEL, socket);
    this.sockets.delete(socket.id);
  }

  /**
   * 유저가 채널에 처음 입장하도록 하는 함수입니다.
   * 유저가 이미 채널에 들어가 있는 상태라면, 채널에서 나가고 새로운 채널에 들어갑니다.
   * 채널에 입장하면 채널에 있는 모든 유저에게 입장 메시지를 보냅니다.
   */
  async joinChannel(
    userId: number,
    channelId: string,
    messageId: number,
  ): Promise<void> {
    this.channelFactory.join(userId, channelId);
    this.sendNoticeToChannel(userId, channelId, CHAT_JOIN, messageId);
  }

  /**
   * 유저가 채널에서 나가도록 하는 함수입니다.
   * 채널에서 나가면 채널에 있는 모든 유저에게 퇴장 메시지를 보냅니다.
   */
  async leaveChannel(userId: number, channelId: string): Promise<void> {
    const user: UserModel = this.userFactory.findById(userId);
    user.socket[GATEWAY_CHANNEL]?.leave(channelId);
    user.joinedChannel = null;
    this.channelFactory.leave(user.id, channelId);
  }

  /**
   * 유저가 채널에 메시지를 보내는 함수입니다.
   * 채널에 있는 모든 참여자에게 메시지를 보냅니다.
   * 유저를 차단한 채널 참여자에게는 메시지를 보내지 않습니다.
   */
  async sendMessageToChannel(message: ChannelMessage): Promise<void> {
    const user: UserModel = this.userFactory.findById(message.user.id);

    const sockets = await this.server?.in(message.channel.id).fetchSockets();

    sockets?.forEach((socket) => {
      if (
        !user.socket[GATEWAY_CHANNEL]?.has(socket.id) &&
        !this.userFactory
          .findById(this.sockets.get(socket.id))
          .blockedList.has(user.id)
      )
        socket.emit(
          CHAT_MESSAGE,
          new MessageModel(
            message.id,
            user.nickname,
            message.content,
            CHATTYPE_OTHERS,
          ),
        );
    });
    user.socket[GATEWAY_CHANNEL]?.forEach((socket: Socket) => {
      socket?.emit(
        CHAT_MESSAGE,
        new MessageModel(
          message.id,
          user.nickname,
          message.content,
          CHATTYPE_ME,
        ),
      );
    });
  }

  /**
   * 채널의 참여자에게 변동이 생겼을 경우, 참여자에게 알림을 보내는 함수입니다.
   * 유저가 채널에 들어오거나 나갔을 경우, 참여자에게 알림을 보냅니다.
   * 유저가 mute 또는 unmute 되었을 경우, 참여자에게 알림을 보냅니다.
   * 유저가 ban되었을 경우, 참여자에게 알림을 보냅니다.
   * 유저가 kick되었을 경우, 참여자에게 알림을 보냅니다.
   * 유저가 admin이 되었을 경우, 참여자에게 알림을 보냅니다.
   * 유저가 admin이 해제되었을 경우, 참여자에게 알림을 보냅니다.
   */
  async sendNoticeToChannel(
    userId: number,
    channelId: string,
    type: ChannelActionType,
    messageId: number,
  ) {
    const nickname = this.userFactory.findById(userId).nickname;
    const message = new MessageModel(
      messageId,
      nickname,
      type,
      CHATTYPE_SYSTEM,
    );
    this.server?.to(channelId).emit(CHATTYPE_SYSTEM, message);
    this.server?.to(channelId).emit('participants', {});
  }

  async sendOutEvent(targetUserId: number, reason: string) {
    const user: UserModel = this.userFactory.findById(targetUserId);
    user.socket[GATEWAY_CHANNEL]?.forEach((socket: Socket) => {
      socket?.emit('out', {
        type: reason,
      });
    });
  }

  async sendMuteEvent(targetUserId: number) {
    const user: UserModel = this.userFactory.findById(targetUserId);
    user.socket[GATEWAY_CHANNEL]?.forEach((socket: Socket) => {
      socket?.emit('mute', {});
    });
  }

  async sendUnMuteEvent(targetUserId: number) {
    const user: UserModel = this.userFactory.findById(targetUserId);
    user.socket[GATEWAY_CHANNEL]?.forEach((socket: Socket) => {
      socket?.emit('unmute', {});
    });
  }
}
