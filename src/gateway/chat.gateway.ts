import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelFactory } from 'src/domain/channel/channel.factory';
import { UserFactory } from 'src/domain/user/user.factory';
import { UserModel } from 'src/domain/user/user.model';
import { ChatType } from 'src/global/type/type.chat';
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

  sendNoticeToChannel(channelId: string, type: ChatType) {
    this.server.to(channelId).emit(type, MessageDto);
  }
}
