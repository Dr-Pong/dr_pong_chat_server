import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { DirectMessageRepository } from 'src/domain/direct-message/direct-message.repository';
import { UserModel } from 'src/domain/factory/model/user.model';
import { UserFactory } from 'src/domain/factory/user.factory';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { DirectMessageRoomRepository } from 'src/domain/direct-message-room/direct-message-room.repository';
import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { MessageModel } from './dto/message.model';
import { CHATTYPE_ME, CHATTYPE_OTHERS } from 'src/global/type/type.chat';
import { GATEWAY_DIRECTMESSAGE } from './type/type.gateway';
import { getUserFromSocket } from 'src/global/utils/socket.utils';
import { DirectMessage } from 'src/domain/direct-message/direct-message.entity';

@WebSocketGateway({ namespace: 'dm' })
export class DirectMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly userFactory: UserFactory,
    private readonly directMessageRepository: DirectMessageRepository,
    private readonly directMessageRoomRepository: DirectMessageRoomRepository,
  ) {}

  /**
   * 'dm' 네임스페이스에 연결되었을 때 실행되는 메서드입니다.
   * 유저가 이미 네임스페이스에 연결된 소켓을 가지고 있다면, 이전 소켓을 끊고 새로운 소켓으로 교체합니다.
   * 유저가 dm을 주고받으려면 네임스페이스에 연결되어 있어야 합니다.
   */
  async handleConnection(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = getUserFromSocket(socket, this.userFactory);
    if (!user) {
      socket.disconnect();
      return;
    }

    if (user.dmSocket?.size >= 5) {
      socket.disconnect();
      return;
    }

    this.userFactory.setSocket(user.id, GATEWAY_DIRECTMESSAGE, socket);
  }

  /**
   * 'dm' 네임스페이스에서 연결이 끊겼을 때 실행되는 메서드입니다.
   * 유저가 dm을 주고받는 중에 연결이 끊겼다면, 마지막 읽은 메시지 id를 업데이트합니다.
   */
  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    const user: UserModel = getUserFromSocket(socket, this.userFactory);
    if (!user) return;

    try {
      await this.updateLastMessageId(user.id);
    } catch (e) {
      console.log('error in disconnect', e);
    }

    this.userFactory.deleteSocket(user.id, GATEWAY_DIRECTMESSAGE, socket);
    this.userFactory.setDirectMessageFriendId(user.id, null);
  }

  /**
   * 유저가 친구에게 메시지를 보냅니다.
   * 친구가 dm 네임스페이스에 연결되어 있지 않다면, 메시지를 보내지 않습니다.
   */
  async sendMessageToFriend(
    userId: number,
    friendId: number,
    message: DirectMessage,
  ): Promise<void> {
    const user: UserModel = this.userFactory.findById(userId);
    const friend: UserModel = this.userFactory.findById(friendId);

    if (friend?.directMessageFriendId === user?.id) {
      friend?.dmSocket?.forEach((socket: Socket) => {
        socket?.emit(
          'message',
          new MessageModel(
            message.id,
            user?.nickname,
            message.message,
            CHATTYPE_OTHERS,
          ),
        );
      });
    }
    user?.dmSocket?.forEach((socket: Socket) => {
      socket?.emit(
        'message',
        new MessageModel(
          message.id,
          user?.nickname,
          message.message,
          CHATTYPE_ME,
        ),
      );
    });
  }

  /**
   * 유저가 현재 대화중인 친구가 누구인지 알려줍니다.
   * disconnect 이벤트가 발생했을 때, 마지막 읽은 메시지 id를 업데이트하기 위해 사용됩니다.
   */
  @SubscribeMessage('dear')
  async joinDirectMessageRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { nickname: string },
  ): Promise<void> {
    if (!data.nickname) return;
    const friend: UserModel = this.userFactory.findByNickname(data.nickname);
    const user: UserModel = getUserFromSocket(socket, this.userFactory);
    if (!friend || !user) return;

    this.userFactory.setDirectMessageFriendId(user.id, friend?.id);

    try {
      await this.updateLastMessageId(user.id);
    } catch (e) {
      console.log('error in dear', e);
    }
  }

  /**
   * 마지막 읽은 메시지 id를 업데이트합니다.
   * user를 찾아와서 현재 dm을 주고받는 친구가 누구인지 확인합니다.
   * 그리고 해당 친구와의 대화방의 마지막 읽은 메시지 id를 업데이트합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  private async updateLastMessageId(userId: number): Promise<void> {
    const user: UserModel = this.userFactory.findById(userId);
    if (!user?.directMessageFriendId) return;

    const lastMessageId: number =
      await this.directMessageRepository.findLastMessageIdByRoomId(
        FriendChatManager.generateRoomId(user.id, user.directMessageFriendId),
      );

    await this.directMessageRoomRepository.updateLastMessageIdByUserIdAndFriendId(
      user.id,
      user.directMessageFriendId,
      lastMessageId,
    );
  }
}
