import { Injectable } from '@nestjs/common';
import { DirectMessageRepository } from '../direct-message/direct-message.repository';
import { DirectMessageRoomRepository } from './direct-message-room.repository';
import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { GetDirectMessageRoomsDto } from './dto/get.direct-message-rooms.dto';
import {
  DirectMessageRoomInfoDto,
  DirectMessageRoomsDto,
} from './dto/direct-message-rooms.dto';
import { DirectMessageRoom } from './direct-message-room.entity';
import { DeleteDirectMessageRoomDto } from './dto/delete.direct-message-room.dto';
import { DirectMessageRoomsNotificationDto } from './dto/direct-message-rooms.notification.dto';
import { GetDirectMessageRoomsNotificationDto } from './dto/get.direct-message-rooms.notification.dto';

@Injectable()
export class DirectMessageRoomService {
  constructor(
    private directRepository: DirectMessageRepository,
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
    await this.directMessageRoomRepository.updateIsDisplayFalseByUserIdAndFriendId(
      deleteDto.userId,
      deleteDto.friendId,
    );
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getDirectMessageRoomsNotification(
    getDto: GetDirectMessageRoomsNotificationDto,
  ): Promise<DirectMessageRoomsNotificationDto> {
    const directMessageRooms: DirectMessageRoom[] =
      await this.directMessageRoomRepository.findAllByUserId(getDto.userId);

    const hasNewChat: boolean = await this.hasNewChat(directMessageRooms);

    const responseDto: DirectMessageRoomsNotificationDto = {
      hasNewChat: hasNewChat,
    };

    return responseDto;
  }

  async hasNewChat(directMessageRooms: DirectMessageRoom[]): Promise<boolean> {
    for (const directMessageRoom of directMessageRooms) {
      const unreadChat: boolean =
        await this.directRepository.hasAnyUnreadChatByRoomId(
          directMessageRoom.roomId,
          directMessageRoom.lastReadMessageId,
        );
      if (unreadChat) return true;
    }
    return false;
  }
}
