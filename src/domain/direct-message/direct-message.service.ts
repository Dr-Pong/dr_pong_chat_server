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

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postDirectMessage(postDto: PostDirectMessageDto): Promise<void> {
    const { userId, friendId, message } = postDto;
    const userFriends: Friend[] =
      await this.friendRepository.findFriendsByUserId(userId);

    for (const friend of userFriends) {
      if (this.isValidFriend(friend, friendId)) {
        await this.directRepository.save(userId, friendId, message);
        const directMessageRoom: DirectMessageRoom =
          await this.directMessageRoomRepository.findByUserIdAndFriendId(
            userId,
            friendId,
          );
        if (!directMessageRoom) {
          await this.directMessageRoomRepository.save(userId, friendId);
        } else {
          if (!directMessageRoom.isDisplay) {
            await this.directMessageRoomRepository.updateIsDisplayTrueByUserIdAndFriendId(
              userId,
              friendId,
            );
          }
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

  private isValidFriend(friend: Friend, friendId: number): boolean {
    return (
      friend.status === FRIENDSTATUS_FRIEND &&
      (friend.sender.id === friendId || friend.receiver.id === friendId)
    );
  }
}
