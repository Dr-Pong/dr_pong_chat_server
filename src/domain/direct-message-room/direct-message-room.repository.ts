import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectMessageRoom } from './direct-message-room.entity';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { DirectMessage } from '../direct-message/direct-message.entity';

@Injectable()
export class DirectMessageRoomRepository {
  constructor(
    @InjectRepository(DirectMessageRoom)
    private readonly repository: Repository<DirectMessageRoom>,
  ) {}

  /** DM Room 을 가져오는 함수
   * 사용자 ID와 친구 ID로 검색하여 DM Room 을 가져옵니다.
   */
  async findByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<DirectMessageRoom> {
    const directMessageRoom: DirectMessageRoom = await this.repository.findOne({
      where: {
        userId: { id: userId },
        friendId: { id: friendId },
      },
    });
    return directMessageRoom;
  }

  /** DM Rooms 을 가져오는 함수
   * 사용자 ID로 검색하여 DM Rooms 을 가져옵니다.
   */
  async findAllByUserId(userId: number): Promise<DirectMessageRoom[]> {
    const directMessageRooms: DirectMessageRoom[] = await this.repository.find({
      where: { userId: { id: userId } },
    });
    return directMessageRooms;
  }

  /** DM Room 을 생성하는 함수
   * 사용자 ID와 친구 ID로 검색하여 DM Room 을 생성합니다.
   */
  async save(userId: number, friendId: number): Promise<DirectMessageRoom> {
    const directMessageRoom: DirectMessageRoom = await this.repository.create({
      userId: { id: userId },
      friendId: { id: friendId },
      roomId: FriendChatManager.generateRoomId(
        userId.toString(),
        friendId.toString(),
      ),
      lastReadMessageId: null,
      isDisplay: true,
    });
    return await this.repository.save(directMessageRoom);
  }

  /** DM Room 을 삭제하는 함수
   * 사용자 ID와 친구 ID로 검색하여 DM Room 을 삭제합니다.
   * SoftDelete 를 사용하여 isDisplay 를 false 로 변경합니다.
   */
  async updateIsDisplayFalseByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ) {
    await this.repository.update(
      {
        userId: { id: userId },
        friendId: { id: friendId },
      },
      { isDisplay: false },
    );
  }

  /** DM Room 을 다시 보이게 하는 함수
   * 사용자 ID와 친구 ID로 검색하여 DM Room 을 다시 보이게 합니다.
   * SoftDelete 를 사용하여 isDisplay 를 true 로 변경합니다.
   */
  async updateIsDisplayTrueByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ) {
    await this.repository.update(
      {
        userId: { id: userId },
        friendId: { id: friendId },
      },
      { isDisplay: true },
    );
  }

  /** DM Room 의 마지막 메시지 ID 를 업데이트하는 함수
   * 사용자 ID와 친구 ID로 검색하여 DM Room 의 마지막 메시지 ID 를 업데이트합니다.
   */
  async updateLastMessageIdByUserIdAndFriendId(
    userId: number,
    friendId: number,
    lastmessage: DirectMessage,
  ) {
    await this.repository.update(
      {
        userId: { id: userId },
        friendId: { id: friendId },
      },
      { lastReadMessageId: lastmessage.id },
    );
  }
}
