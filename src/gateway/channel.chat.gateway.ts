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
  CHAT_MESSAGE,
  ChannelActionType,
} from 'src/domain/channel/type/type.channel.action';
import { MessageModel } from 'src/gateway/dto/message.model';
import { CHATTYPE_OTHERS, CHATTYPE_SYSTEM } from 'src/global/type/type.chat';
import { JwtService } from '@nestjs/jwt';
import { USERSTATUS_OFFLINE } from 'src/global/type/type.user.status';

@WebSocketGateway({ namespace: 'channel' })
export class ChannelChatGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly tokenService: JwtService,
    private readonly userFactory: UserFactory,
    private readonly channelFactory: ChannelFactory,
  ) {}
  @WebSocketServer()
  server: Server;
  sockets: Map<string, UserModel> = new Map();
  users: Map<number, UserModel> = new Map();

  async handleConnection(@ConnectedSocket() socket: Socket) {
    console.log('connect: ', socket.id);
    const token: string = socket.handshake.auth.Authorization;
    console.log(token);

    if (!token) return;
    const token2 = this.tokenService.verify(token.split(' ')[1]);
    const { id } = token2;
    const user: UserModel = this.userFactory.findById(id);

    this.users.set(user.id, user);
    this.sockets.set(socket.id, user);
    if (user.joinedChannel) {
      socket.join(user.joinedChannel);
      user.socket = socket;
    }
    user.status = 'online';
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const user: UserModel = this.sockets.get(socket.id);
    this.users.delete(user.id);
    this.sockets.delete(socket.id);
    console.log('disconnect: ', socket.id);
  }

  async sendMessageToChannel(messageDto: MessageDto) {
    const { userId, channelId } = messageDto;
    const user: UserModel = this.userFactory.findById(userId);
    const message = new MessageModel(
      user.nickname,
      messageDto.content,
      CHATTYPE_OTHERS,
    );

    if (user.status === USERSTATUS_OFFLINE) return;
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
  }

  async sendMessageToUser(message: MessageDto) {
    const { userId } = message;
    const user: UserModel = this.userFactory.findById(userId);
    if (user.status === USERSTATUS_OFFLINE) return;
    user.socket?.emit(CHAT_MESSAGE, message);
  }
}
