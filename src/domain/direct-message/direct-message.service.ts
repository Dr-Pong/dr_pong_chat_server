import { Injectable } from '@nestjs/common';
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
import { IsolationLevel, Transactional } from 'typeorm-transactional';

@Injectable()
export class DirectMessageService {
  constructor(
    private directRepository: DirectMessageRepository,
    private friendRepository: FriendRepository,
    private directMessageRoomRepository: DirectMessageRoomRepository,
  ) {}

  /** DirectMessage 히스토리조회
   * 사용자 간의 DirectMessage 히스토리를 조회합니다.
   *
   * @param getDto - 직접 메시지 히스토리 조회를 위한 DTO
   * @param getDto.userId - 사용자 ID
   * @param getDto.friendId - 친구 ID
   * @param getDto.offset - 히스토리 조회의 시작 오프셋
   * @param getDto.count - 조회할 메시지의 개수
   * @returns Promise<GetDirectMessageHistoryResponseDto> - 직접 메시지 히스토리를 담은 Promise를 반환합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getDirectMessagesHistory(
    getDto: GetDirectMessageHistoryDto,
  ): Promise<GetDirectMessageHistoryResponseDto> {
    const { userId, friendId, offset, count } = getDto;
    const directMessagesHistory: DirectMessage[] =
      await this.directRepository.findAllByUserIdAndFriendId(
        userId,
        friendId,
        offset,
        count,
      );

    let lastPage = false;
    for (const directMessage of directMessagesHistory) {
      if (directMessage.id === getDto.offset) {
        lastPage = true;
        break;
      }
    }
    const responseDto: GetDirectMessageHistoryResponseDto = {
      chats: directMessagesHistory.map((directMessage: DirectMessage) => {
        const chatDto: ChatDto = {
          id: directMessage.id,
          nickname: directMessage.sender.nickname,
          message: directMessage.message,
          createdAt: directMessage.createdAt,
        };
        return chatDto;
      }),
      isLastPage: lastPage,
    };

    return responseDto;
  }

  /**
   * 주어진 `postDto.userId`, `postDto.friendId`, `postDto.message`를 사용하여
   * 사용자 간의 직접 메시지를 전송합니다.
   *
   * @param postDto - 직접 메시지 전송을 위한 DTO (Data Transfer Object)
   * @param postDto.userId - 보내는 사용자의 ID
   * @param postDto.friendId - 메시지를 받을 친구의 ID
   * @param postDto.message - 전송할 메시지 내용
   * @returns Promise<void> - Promise를 반환하며, 성공적으로 메시지를 전송한 경우에는 아무 값도 반환하지 않습니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postDirectMessage(postDto: PostDirectMessageDto): Promise<void> {
    const { userId, friendId, message } = postDto;

    // 보내는 사용자의 친구 목록 조회
    const userFriends: Friend[] =
      await this.friendRepository.findFriendsByUserId(userId);

    for (const friend of userFriends) {
      // 메시지를 받을 친구와 유효한 친구인지 확인
      if (this.isValidFriend(friend, friendId)) {
        // 메시지 저장
        await this.directRepository.save(userId, friendId, message);

        // 대화방 확인
        const directMessageRoom: DirectMessageRoom =
          await this.directMessageRoomRepository.findByUserIdAndFriendId(
            userId,
            friendId,
          );

        if (!directMessageRoom) {
          // 대화방이 존재하지 않는 경우 새로 생성
          await this.directMessageRoomRepository.save(userId, friendId);
        } else {
          if (!directMessageRoom.isDisplay) {
            // 대화방이 표시되지 않는 경우 표시 여부 업데이트
            await this.directMessageRoomRepository.updateIsDisplayTrueByUserIdAndFriendId(
              userId,
              friendId,
            );
          }

          // 가장 최근 메시지 업데이트
          const lastmessage: DirectMessage =
            await this.directRepository.findByUserIdAndFriendIdOrderByIdDesc(
              userId,
              friendId,
            );
          await this.directMessageRoomRepository.updateLastMessageIdByUserIdAndFriendId(
            userId,
            friendId,
            lastmessage,
          );
        }
      }
    }
  }

  /**
   * 주어진 친구와 friendId가 유효한 친구인지 확인합니다.
   *
   * @param friend - 확인할 친구 객체
   * @param friendId - 메시지를 받을 친구의 ID
   * @returns boolean - 유효한 친구인 경우 true를 반환하고, 그렇지 않은 경우 false를 반환합니다.
   */
  private isValidFriend(friend: Friend, friendId: number): boolean {
    return (
      friend.status === FRIENDSTATUS_FRIEND &&
      (friend.sender.id === friendId || friend.receiver.id === friendId)
    );
  }
}
