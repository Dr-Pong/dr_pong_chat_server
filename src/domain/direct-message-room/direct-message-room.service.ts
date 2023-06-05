import { Injectable } from '@nestjs/common';
import { DirectMessageRepository } from '../direct-message/direct-message.repository';
import { FriendRepository } from '../friend/friend.repository';
import { DirectMessageRoomRepository } from './direct-message-room.repository';
import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { GetDirectMessageRoomsDto } from './dto/get.direct-message-rooms.dto';
import {
  DirectMessageRoomInfoDto,
  DirectMessageRoomsDto,
} from './dto/direct-message-rooms.dto';
import { DirectMessageRoom } from './direct-message-room.entity';
import { DeleteDirectMessageRoomDto } from './dto/delete.direct-message-room.dto';

@Injectable()
export class DirectMessageRoomService {
  constructor(
    private directRepository: DirectMessageRepository,
    // private friendRepository: FriendRepository,
    private directMessageRoomRepository: DirectMessageRoomRepository,
  ) {}

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getAllDirectMessageRooms(
    getDto: GetDirectMessageRoomsDto,
  ): Promise<DirectMessageRoomsDto> {
    const directMessageRooms: DirectMessageRoom[] =
      await this.directMessageRoomRepository.findAllByUserId(getDto.userId);

    const responseDto: DirectMessageRoomsDto = {
      chatList: [],
    };

    for (const directMessageRoom of directMessageRooms) {
      const directMessageRoomInfo: DirectMessageRoomInfoDto = {
        nickname: directMessageRoom.friendId.nickname,
        imgUrl: directMessageRoom.friendId.image.url,
        newChat: await this.directRepository.countAllUnreadChatByRoomId(
          directMessageRoom.roomId,
          directMessageRoom.lastReadMessageId,
        ),
      };

      responseDto.chatList.push(directMessageRoomInfo);
    }

    return responseDto;
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteDirectMessageRoom(deleteDto: DeleteDirectMessageRoomDto) {
    const directMessageRoom: DirectMessageRoom =
      await this.directMessageRoomRepository.findByUserIdAndFriendId(
        deleteDto.userId,
        deleteDto.friendId,
      );

    await this.directMessageRoomRepository.delete(directMessageRoom);
  }
}
