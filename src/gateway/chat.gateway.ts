import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelFactory } from 'src/domain/factory/channel.factory';
import { UserFactory } from 'src/domain/factory/user.factory';
import { UserModel } from 'src/domain/factory/model/user.model';
import { ChannelActionType } from 'src/domain/channel/type/type.channel.action';
import { MessageDto } from './dto/message.dto';

@Injectable()
export class ChatGateWay implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly userFactory: UserFactory,
    private readonly channelFactory: ChannelFactory,
  ) {}
  @WebSocketServer()
  server: Server;

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log('connect: ', socket.id);
    socket.join(socket.id);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('disconnect: ', socket.id);
  }

  sendMessageToChannel(userId: number, channelId: string, message: MessageDto) {
    const user: UserModel = this.userFactory.findById(userId);
    if (!user.socket) return;
    const channelUsers: UserModel[] = [];

    this.channelFactory.findById(channelId).users.forEach((id) => {
      channelUsers.push(this.userFactory.findById(id));
    });

    const blockList: string[] = [];

    channelUsers.forEach((user) => {
      if (user.socket && user.blockedList.has(userId))
        blockList.push(user.socket.id);
    });

    this.server.to(channelId).except(blockList).emit('message', message);
  }

  sendNoticeToChannel(channelId: string, type: ChannelActionType) {
    this.server.to(channelId).emit(type, MessageDto);
  }
}
