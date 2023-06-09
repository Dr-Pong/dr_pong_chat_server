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

  /** DM Room 을 가져오는 함수
   * 모든 사용자 Id로 검색하여 DM Room 을 가져옵니다.
   * @param getDto.userId - 사용자 ID
   */
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
        nickname: directMessageRoom.friend.nickname,
        imgUrl: directMessageRoom.friend.image.url,
        newChats: await this.directRepository.countAllUnreadChatByRoomId(
          directMessageRoom.roomId,
          directMessageRoom.lastReadMessageId,
        ),
      };

      responseDto.chatList.push(directMessageRoomInfo);
    }

    return responseDto;
  }

  /** DM Room 을 삭제하는 함수
   * 사용자 ID와 친구 ID로 검색하여 DM Room 을 삭제합니다.
   * SoftDelete 를 사용하여 isDisplay 를 false 로 변경합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteDirectMessageRoom(deleteDto: DeleteDirectMessageRoomDto) {
    await this.directMessageRoomRepository.updateIsDisplayFalseByUserIdAndFriendId(
      deleteDto.userId,
      deleteDto.friendId,
    );
  }

  /** DM Room 의 새로운 채팅 여부를 가져오는 함수
   * 모든 사용자 Id로 검색하여 DM Room 의 새로운 채팅 여부를 boolean으로 가져옵니다.
   */
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

  /** getDirectMessageRoomsNotification함수에서
   * DM Room 의 새로운 채팅 여부를 boolean으로 가져옵니다.
   */
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
