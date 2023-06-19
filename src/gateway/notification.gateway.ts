import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserFactory } from 'src/domain/factory/user.factory';
import { UserModel } from 'src/domain/factory/model/user.model';
import {
  CHAT_MESSAGE,
  ChannelActionType,
} from 'src/domain/channel/type/type.channel.action';
import { MessageDto } from './dto/message.dto';
import { MessageModel } from 'src/gateway/dto/message.model';
import { CHATTYPE_SYSTEM } from 'src/global/type/type.chat';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway()
export class NotificationGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly userFactory: UserFactory,
    private readonly tokenService: JwtService,
  ) {}
  @WebSocketServer()
  private readonly server: Server;
  private sockets: Map<string, UserModel> = new Map();

  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
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

  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    this.sockets.delete(socket.id);
    console.log('disconnect: ', socket.id);
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
}

export function getTokenFromSocket(socket: Socket): string {
  return socket.handshake.auth?.Authorization?.split(' ')[1] ?? null;
}
