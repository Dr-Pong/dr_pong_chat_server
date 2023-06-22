import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { checkUserExist } from 'src/domain/channel/validation/errors.channel';
import { DirectMessageRepository } from 'src/domain/direct-message/direct-message.repository';
import { UserModel } from 'src/domain/factory/model/user.model';
import { UserFactory } from 'src/domain/factory/user.factory';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { getTokenFromSocket } from './notification.gateway';
import { DirectMessageRoomRepository } from 'src/domain/direct-message-room/direct-message-room.repository';
import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { MessageModel } from './dto/message.model';
import { CHATTYPE_OTHERS } from 'src/global/type/type.chat';

@WebSocketGateway({ namespace: 'dm' })
export class DirectMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly tokenService: JwtService,
    private readonly userFactory: UserFactory,
    private readonly directMessageRepository: DirectMessageRepository,
    private readonly directMessageRoomRepository: DirectMessageRoomRepository,
  ) {}
  sockets: Map<string, UserModel> = new Map();

  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const accessToken = getTokenFromSocket(socket);
    if (!accessToken) {
      socket.disconnect();
      return;
    }
    let userToken;
    try {
      userToken = this.tokenService.verify(accessToken);
    } catch (e) {
      socket.disconnect();
      return;
    }
    const userId = userToken.id;
    console.log('friend connect', userToken.nickname, socket.id);

    const user: UserModel = this.userFactory.findById(userId);
    if (!user) {
      socket.disconnect();
      return;
    }

    if (user.socket && user.socket['directMessage']?.id !== socket?.id) {
      user.socket['directMessage']?.disconnect();
    }

    this.sockets.set(socket.id, user);
    this.userFactory.setSocket(user.id, 'directMessage', socket);
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    const user = this.sockets.get(socket.id);

    const lastMessageId: number =
      await this.directMessageRepository.findLastMessageIdByRoomId(
        FriendChatManager.generateRoomId(
          user.id.toString(),
          user.directMessageFriendId.toString(),
        ),
      );

    this.directMessageRoomRepository.updateLastMessageIdByUserIdAndFriendId(
      user.id,
      user.directMessageFriendId,
      lastMessageId,
    );

    this.sockets.delete(socket.id);
    this.userFactory.setSocket(user.id, 'directMessage', null);
  }

  async sendMessageToFriend(
    userId: number,
    friendId: number,
    content: string,
  ): Promise<void> {
    const user: UserModel = this.userFactory.findById(userId);
    const friend: UserModel = this.userFactory.findById(friendId);

    const message: MessageModel = new MessageModel(
      user.nickname,
      content,
      CHATTYPE_OTHERS,
    );

    friend.socket['directMessage'].emit('message', message);
  }

  @SubscribeMessage('deer')
  async joinDirectMessageRoom(
    @ConnectedSocket() socket: Socket,
    data: { nickname: string },
  ): Promise<void> {
    const friend: UserModel = this.userFactory.findByNickname(data.nickname);
    const user: UserModel = this.sockets.get(socket.id);
    checkUserExist(friend);
    checkUserExist(user);

    user.directMessageFriendId = friend.id;
  }
}
