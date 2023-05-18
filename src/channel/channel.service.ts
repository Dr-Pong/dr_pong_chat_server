import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
export class ChannelService implements OnApplicationBootstrap {
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly channelFactory: ChannelFactory;
  ) {}

  async onApplicationBootstrap() {
    console.log();
  }

  sendMessage(client, message: string) {
    const success = client.emit(message);
    console.log(success);
  }
}
