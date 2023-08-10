import { BadRequestException, Injectable } from '@nestjs/common';
import { DirectMessageRepository } from './direct-message.repository';
import { GetDirectMessageHistoryDto } from './dto/get.direct-message.history.dto';
import {
  ChatDto,
  GetDirectMessageHistoryResponseDto,
} from './dto/get.direct-message.history.response.dto';
import { DirectMessage } from './direct-message.entity';
import { PostDirectMessageDto } from './dto/post.direct-message.dto';
import { FriendRepository } from '../friend/friend.repository';
import { Friend } from '../friend/friend.entity';
import { FRIENDSTATUS_FRIEND } from 'src/global/type/type.friend.status';
import { DirectMessageRoomRepository } from '../direct-message-room/direct-message-room.repository';
import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
} from 'typeorm-transactional';
import {
  CHATTYPE_ME,
  CHATTYPE_OTHERS,
  CHATTYPE_SYSTEM,
  ChatType,
} from 'src/global/type/type.chat';
import { DirectMessageGateway } from 'src/gateway/direct-message.gateway';
import { NotificationGateWay } from 'src/gateway/notification.gateway';
import { UserFactory } from '../factory/user.factory';
import { FriendChatManager } from 'src/global/utils/generate.room.id';

@Injectable()
export class DirectMessageService {
  constructor(
    private directRepository: DirectMessageRepository,
    private friendRepository: FriendRepository,
    private directMessageRoomRepository: DirectMessageRoomRepository,
    private directMessageGateway: DirectMessageGateway,
    private readonly notificationGateway: NotificationGateWay,
    private userFactory: UserFactory,
  ) {}

  /** DirectMessage 히스토리조회
   * offset과 count 를 이용해서 사용자 간의 DirectMessage 히스토리를 조회합니다.
   */
  async getDirectMessagesHistory(
    getDto: GetDirectMessageHistoryDto,
  ): Promise<GetDirectMessageHistoryResponseDto> {
    const { userId, friendId, offset, count } = getDto;
    const directMessagesHistory: DirectMessage[] =
      await this.directRepository.findAllByUserIdAndFriendId(
        userId,
        friendId,
        offset,
        count + 1,
      );

    const lastPage: boolean = directMessagesHistory.length < count + 1;
    if (!lastPage) {
      directMessagesHistory.pop();
    }

    const getType = (
      senderId: number,
      userId: number,
      friendId: number,
    ): ChatType => {
      if (senderId === userId) {
        return CHATTYPE_ME;
      } else if (senderId === friendId) {
        return CHATTYPE_OTHERS;
      } else {
        return CHATTYPE_SYSTEM;
      }
    };

    const createChatDto = (directMessage: DirectMessage): ChatDto => {
      return {
        id: directMessage.id,
        nickname: directMessage.sender.nickname,
        message: directMessage.message,
        time: directMessage.time,
        type: getType(directMessage.sender.id, userId, friendId),
      };
    };

    const responseDto: GetDirectMessageHistoryResponseDto = {
      chats: directMessagesHistory.map(createChatDto),
      isLastPage: lastPage,
    };

    return responseDto;
  }

  /**
   * 주어진 `postDto.userId`, `postDto.friendId`, `postDto.message`를 사용하여
   * 사용자 간의 직접 메시지를 전송합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postDirectMessage(postDto: PostDirectMessageDto): Promise<void> {
    const { userId, friendId, message } = postDto;

    const isFriend: boolean =
      await this.friendRepository.checkIsFriendByUserIdAndFriendId(
        userId,
        friendId,
      );

    //친구 여부 확인
    if (!isFriend) throw new BadRequestException('not a friend');

    // 대화방 확인
    const newMessage: DirectMessage = await this.directRepository.save(
      userId,
      friendId,
      message,
    );
    await this.renewDirectMessageRoom(userId, friendId, newMessage.id);

    runOnTransactionComplete(() => {
      this.directMessageGateway.sendMessageToFriend(
        userId,
        friendId,
        newMessage,
      );
      this.notificationGateway.newChatNotice(userId, friendId);
    });
  }

  private async renewDirectMessageRoom(
    userId: number,
    friendId: number,
    newMessageId: number,
  ) {
    // 대화방이 표시되지 않는 경우 표시 여부 업데이트
    await this.directMessageRoomRepository.updateIsDisplayTrueByRoomId(
      FriendChatManager.generateRoomId(userId, friendId),
    );

    // 대화방의 마지막 메시지 업데이트
    if (this.userFactory.findById(friendId)?.directMessageFriendId === userId) {
      this.directMessageRoomRepository.updateLastMessageIdByUserIdAndFriendId(
        friendId,
        userId,
        newMessageId,
      );
    }

    await this.directMessageRoomRepository.updateLastMessageIdByUserIdAndFriendId(
      userId,
      friendId,
      newMessageId,
    );
  }

  /**
   * 주어진 친구와 friendId가 유효한 친구인지 확인합니다.
   * @returns boolean - 유효한 친구인 경우 true를 반환하고, 그렇지 않은 경우 false를 반환합니다.
   */
  private isValidFriend(friend: Friend, friendId: number): boolean {
    return (
      friend.status === FRIENDSTATUS_FRIEND &&
      (friend.sender.id === friendId || friend.receiver.id === friendId)
    );
  }
}
