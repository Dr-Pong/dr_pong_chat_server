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
import { MessageDto } from './dto/message.dto';
import { UserModel } from 'src/domain/factory/model/user.model';
import {
  CHAT_JOIN,
  CHAT_LEAVE,
  CHAT_MESSAGE,
  ChannelActionType,
} from 'src/domain/channel/type/type.channel.action';
import { MessageModel } from 'src/gateway/dto/message.model';
import { CHATTYPE_OTHERS, CHATTYPE_SYSTEM } from 'src/global/type/type.chat';
import { JwtService } from '@nestjs/jwt';
import { InviteModel } from 'src/domain/factory/model/invite.model';
import { getTokenFromSocket } from './notification.gateway';

@WebSocketGateway({ namespace: 'channel' })
export class ChannelGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly tokenService: JwtService,
    private readonly userFactory: UserFactory,
    private readonly channelFactory: ChannelFactory,
  ) {}
  @WebSocketServer()
  private readonly server: Server;
  private sockets: Map<string, UserModel> = new Map();

  async handleConnection(@ConnectedSocket() socket: Socket) {
    const accessToken = this.tokenService.verify(getTokenFromSocket(socket));

    const { id } = accessToken;
    const user: UserModel = this.userFactory.findById(id);
    if (user.socket && user.socket?.id !== socket?.id) {
      user.socket.disconnect();
    }

    this.sockets.set(socket.id, user);
    user.socket = socket;
    if (user.joinedChannel) {
      socket.join(user.joinedChannel);
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.sockets.delete(socket.id);
    console.log('disconnect: ', socket.id);
  }

  async joinChannel(user: UserModel, channelId: string): Promise<void> {
    user.socket?.join(channelId);
    user.joinedChannel = channelId;
    this.channelFactory.join(user.id, channelId);
    this.sendNoticeToChannel(user.id, channelId, CHAT_JOIN);
  }

  async leaveChannel(user: UserModel, channelId: string): Promise<void> {
    user.socket?.leave(channelId);
    user.joinedChannel = null;
    this.channelFactory.leave(user.id, channelId);
    this.sendNoticeToChannel(user.id, channelId, CHAT_LEAVE);
  }

  async invite(target: UserModel, invite: InviteModel) {
    if (target.socket) {
      target.socket.emit('invite', invite);
    }
    this.userFactory.invite(target.id, invite);
  }

  async sendMessageToChannel(messageDto: MessageDto) {
    const { userId, channelId } = messageDto;
    const user: UserModel = this.userFactory.findById(userId);
    const message = new MessageModel(
      user.nickname,
      messageDto.content,
      CHATTYPE_OTHERS,
    );

    const sockets = await this.server.in(channelId).fetchSockets();

    sockets.forEach((socket) => {
      if (
        socket.id !== user.socket?.id &&
        !this.sockets.get(socket.id).blockedList.has(user.id)
      )
        socket.emit(CHAT_MESSAGE, message);
    });
  }

  async sendNoticeToChannel(
    userId: number,
    channelId: string,
    type: ChannelActionType,
  ) {
    const nickname = this.userFactory.findById(userId).nickname;
    const message = new MessageModel(nickname, type, CHATTYPE_SYSTEM);
    this.server?.to(channelId).emit(CHATTYPE_SYSTEM, message);
    this.server?.to(channelId).emit('participants', {});
  }
}
