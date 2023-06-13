import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_PENDING,
  FriendType,
} from 'src/global/type/type.friend.status';

@Injectable()
export class FriendRepository {
  constructor(
    @InjectRepository(Friend)
    private readonly repository: Repository<Friend>,
  ) {}

  /**친구 목록
   * 사용자의 친구 목록을 가져옵니다.
   * */
  async findFriendsByUserId(userId: number): Promise<Friend[]> {
    return await this.repository.find({
      where: [
        { sender: { id: userId }, status: FRIENDSTATUS_FRIEND },
        { receiver: { id: userId }, status: FRIENDSTATUS_FRIEND },
      ],
    });
  }

  /**친구 요청 목록
   * 사용자의 친구 요청목록을 가져옵니다.
   * */
  async findPendingsByReceiverId(receiverId: number): Promise<Friend[]> {
    return await this.repository.find({
      where: { receiver: { id: receiverId }, status: FRIENDSTATUS_PENDING },
    });
  }

  /**친구 요청 목록
   * 사용자의 친구 요청목록의 개수를 가져옵니다.
   * */
  async countPendingsByReceiverId(receiverId: number): Promise<number> {
    return await this.repository.count({
      where: { receiver: { id: receiverId }, status: FRIENDSTATUS_PENDING },
    });
  }

  /**친구 requesting 여부
   * 유저가 friendId에게 requesting 상태인지 boolean을 반환합니다.
   */
  async checkIsPendingBySenderIdAndReceiverId(
    senderId: number,
    receiverId: number,
  ): Promise<boolean> {
    return this.repository.exist({
      where: [
        {
          sender: { id: senderId },
          receiver: { id: receiverId },
          status: FRIENDSTATUS_PENDING,
        },
      ],
    });
  }

  /**친구 여부 확인
   * 유저와 친구의 id로 둘이 친구인지 boolean을 반환합니다.
   */
  async checkIsFriendByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<boolean> {
    return await this.repository.exist({
      where: [
        {
          sender: { id: userId },
          receiver: { id: friendId },
          status: FRIENDSTATUS_FRIEND,
        },
        {
          sender: { id: friendId },
          receiver: { id: userId },
          status: FRIENDSTATUS_FRIEND,
        },
      ],
    });
  }

  async findFriendByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<Friend> {
    return await this.repository.findOne({
      where: [
        {
          sender: { id: userId },
          receiver: { id: friendId },
          status: FRIENDSTATUS_FRIEND,
        },
        {
          sender: { id: friendId },
          receiver: { id: userId },
          status: FRIENDSTATUS_FRIEND,
        },
      ],
    });
  }

  async saveFriendStatusBySenderIdAndReceiverId(
    status: FriendType,
    senderId: number,
    receiverId: number,
  ): Promise<void> {
    await this.repository.save({
      sender: { id: senderId },
      receiver: { id: receiverId },
      status: status,
    });
  }

  async updateFriendStatusFromToBySenderIdAndReceiverId(
    from: FriendType,
    to: FriendType,
    senderId: number,
    receiverId: number,
  ): Promise<void> {
    await this.repository.update(
      {
        sender: { id: senderId },
        receiver: { id: receiverId },
        status: from,
      },
      { status: to },
    );
  }

  async hardDeleteFriendBySenderIdAndReceiverId(
    senderId: number,
    receiverId: number,
  ): Promise<void> {
    await this.repository.delete({
      sender: { id: senderId },
      receiver: { id: receiverId },
    });
  }
}
