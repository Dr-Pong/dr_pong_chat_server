import { Injectable } from '@nestjs/common';
import { DirectMessage } from './direct-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { FriendChatManager } from 'src/global/utils/generate.room.id';

@Injectable()
export class DirectMessageRepository {
  constructor(
    @InjectRepository(DirectMessage)
    private readonly repository: Repository<DirectMessage>,
  ) {}

  /**
   * 주어진 사용자 ID와 친구 ID에 해당하는 대화 메시지를 조회합니다.
   * @param userId - 사용자 ID
   * @param friendId - 친구 ID
   * @param offset - 조회 시작 위치 (오프셋)
   * @param count - 조회할 메시지 수
   * @returns Promise<DirectMessage[]> - 조회된 대화 메시지 배열을 반환합니다.
   */
  async findAllByUserIdAndFriendId(
    userId: number,
    friendId: number,
    offset: number,
    count: number,
  ): Promise<DirectMessage[]> {
    const directMessages: DirectMessage[] = await this.repository.find({
      where: {
        roomId: FriendChatManager.generateRoomId(
          userId.toString(),
          friendId.toString(),
        ),
      },
      skip: offset,
      take: count,
    });
    return directMessages;
  }

  /**
   * 주어진 사용자 ID, 친구 ID, 메시지를 저장합니다.
   * @param userId - 보내는 사용자의 ID
   * @param friendId - 메시지를 받을 친구의 ID
   * @param message - 전송할 메시지 내용
   * @returns Promise<void> - Promise를 반환하며, 아무 값도 반환하지 않습니다.
   */
  async save(userId: number, friendId: number, message: string): Promise<void> {
    const directMessage: DirectMessage = await this.repository.create({
      sender: { id: userId },
      roomId: FriendChatManager.generateRoomId(
        userId.toString(),
        friendId.toString(),
      ),
      message: message,
      time: new Date(),
    });
    await this.repository.save(directMessage);
  }

  /**
   * 주어진 사용자 ID, 친구 ID에 해당하는 대화 메시지 중 가장 최근 메시지를 조회합니다.
   * @param userId - 사용자 ID
   * @param friendId - 친구 ID
   * @returns Promise<DirectMessage> - 조회된 가장 최근 메시지를 반환합니다.
   */
  async findByUserIdAndFriendIdOrderByIdDesc(
    userId: number,
    friendId: number,
  ): Promise<DirectMessage> {
    const directMessage: DirectMessage = await this.repository.findOne({
      where: {
        roomId: FriendChatManager.generateRoomId(
          userId.toString(),
          friendId.toString(),
        ),
      },
      order: {
        id: 'DESC',
      },
    });
    return directMessage;
  }

  /**
   * 주어진 대화방 ID와 마지막 메시지 ID보다 큰 ID를 가지는 대화 메시지의 수를 카운트합니다.
   *
   * @param roomId - 대화방 ID
   * @param lastMessageId - 마지막 메시지 ID
   * @returns Promise<number> - 읽지 않은 대화 메시지 수를 반환합니다.
   */
  async countAllUnreadChatByRoomId(
    roomId: string,
    lastMessageId: number,
  ): Promise<number> {
    if (lastMessageId === null) lastMessageId = 0;
    const unreadChats: number = await this.repository.count({
      where: {
        roomId: roomId,
        id: MoreThan(lastMessageId),
      },
    });

    return unreadChats;
  }

  /**
   * 주어진 대화방 ID와 마지막 메시지 ID보다 큰 ID를 가지는 대화 메시지가 있는지 확인합니다.
   *
   * @param roomId - 대화방 ID
   * @param lastMessageId - 마지막 메시지 ID
   * @returns Promise<boolean> - 대화 메시지가 있는 경우 true를 반환하고, 그렇지 않은 경우 false를 반환합니다.
   */
  async hasAnyUnreadChatByRoomId(
    roomId: string,
    lastMessageId: number,
  ): Promise<boolean> {
    if (lastMessageId === null) lastMessageId = 0;
    const unreadChat: DirectMessage = await this.repository.findOne({
      where: {
        roomId: roomId,
        id: MoreThan(lastMessageId),
      },
    });

    return unreadChat !== null;
  }
}
