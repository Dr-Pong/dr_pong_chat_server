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
import { DirectMessageRoom } from '../direct-message-room/direct-message-room.entity';
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

@Injectable()
export class DirectMessageService {
  constructor(
    private directRepository: DirectMessageRepository,
    private friendRepository: FriendRepository,
    private directMessageRoomRepository: DirectMessageRoomRepository,
    private directMessageGateway: DirectMessageGateway,
    private readonly notificationGateway: NotificationGateWay,
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
    this.directMessageGateway.sendMessageToFriend(userId, friendId, message);
    await this.checkRoomExistsAndDisplayed(userId, friendId);
    await this.directRepository.save(userId, friendId, message);

    runOnTransactionComplete(() => {
      this.notificationGateway.newChatNotice(friendId);
    });
  }

  private async checkRoomExistsAndDisplayed(userId: number, friendId: number) {
    let directMessageRoom: DirectMessageRoom =
      await this.directMessageRoomRepository.findByUserIdAndFriendId(
        userId,
        friendId,
      );

    if (!directMessageRoom) {
      // 대화방이 존재하지 않는 경우 새로 생성
      directMessageRoom = await this.directMessageRoomRepository.save(
        userId,
        friendId,
      );
    }
    if (!directMessageRoom.isDisplay) {
      // 대화방이 표시되지 않는 경우 표시 여부 업데이트
      await this.directMessageRoomRepository.updateIsDisplayTrueByUserIdAndFriendId(
        userId,
        friendId,
      );
    }
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
