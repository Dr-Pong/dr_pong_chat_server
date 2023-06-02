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

@Injectable()
export class DirectMessageService {
  constructor(
    private directRepository: DirectMessageRepository,
    private friendRepository: FriendRepository,
    private directMessageRoomRepository: DirectMessageRoomRepository,
  ) {}

  async getDirectMessagesHistory(
    getDto: GetDirectMessageHistoryDto,
  ): Promise<GetDirectMessageHistoryResponseDto> {
    const directMessagesHistory: DirectMessage[] =
      await this.directRepository.findAllByUserIdAndFriendId(
        getDto.userId,
        getDto.friendId,
        getDto.offset,
        getDto.count,
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

  async postDirectMessage(postDto: PostDirectMessageDto): Promise<void> {
    const userFriends: Friend[] =
      await this.friendRepository.findFriendsByUserId(postDto.userId);

    for (const friend of userFriends) {
      if (
        friend.status === FRIENDSTATUS_FRIEND &&
        (friend.sender.id === postDto.friendId ||
          friend.receiver.id === postDto.friendId)
      ) {
        await this.directRepository.save(
          postDto.userId,
          postDto.friendId,
          postDto.message,
        );
        const directMessageRoom: DirectMessageRoom =
          await this.directMessageRoomRepository.findByUserIdAndFriendId(
            postDto.userId,
            postDto.friendId,
          );
        if (!directMessageRoom) {
          await this.directMessageRoomRepository.save(
            postDto.userId,
            postDto.friendId,
          );
        } else {
          if (!directMessageRoom.isDisplay) {
            await this.directMessageRoomRepository.updateIsDisplayByUserIdAndFriendId(
              postDto.userId,
              postDto.friendId,
            );
          }
          const lastmessage: DirectMessage =
            await this.directRepository.findByUserIdAndFriendIdOrderByIdDesc(
              postDto.userId,
              postDto.friendId,
            );
          await this.directMessageRoomRepository.updateLastMessageIdByUserIdAndFriendId(
            postDto.userId,
            postDto.friendId,
            lastmessage,
          );
        }
      }
    }
  }
}
