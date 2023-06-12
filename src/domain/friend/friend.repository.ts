import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
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
    const friends: Friend[] = await this.repository.find({
      where: [
        { sender: { id: userId }, status: FRIENDSTATUS_FRIEND },
        { receiver: { id: userId }, status: FRIENDSTATUS_FRIEND },
      ],
    });
    return friends;
  }

  /**친구 요청 목록
   * 사용자의 친구 요청목록을 가져옵니다.
   * */
  async findFriendRequestingsByUserId(userId: number): Promise<Friend[]> {
    const friends: Friend[] = await this.repository.find({
      where: { receiver: { id: userId }, status: FRIENDSTATUS_REQUESTING },
    });
    return friends;
  }

  /**친구 요청 목록
   * 사용자의 친구 요청목록의 개수를 가져옵니다.
   * */
  async countFriendRequestingsByUserId(userId: number): Promise<number> {
    const friendCount: number = await this.repository.count({
      where: { receiver: { id: userId }, status: FRIENDSTATUS_REQUESTING },
    });
    return friendCount;
  }

  /**친구 requesting 여부
   * 유저가 friendId에게 requesting 상태인지 boolean을 반환합니다.
   */
  async checkIsRequestingBySenderIdAndReceiverId(
    senderId: number,
    receiverId: number,
  ): Promise<boolean> {
    const isRequesting: boolean = await this.repository.exist({
      where: [
        {
          sender: { id: senderId },
          receiver: { id: receiverId },
          status: FRIENDSTATUS_REQUESTING,
        },
      ],
    });
    return isRequesting;
  }

  /**친구 여부 확인
   * 유저와 친구의 id로 둘이 친구인지 boolean을 반환합니다.
   */
  async checkIsFriendByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<boolean> {
    const isFriend: boolean = await this.repository.exist({
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
    return isFriend;
  }

  async findFriendByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<Friend> {
    const friend: Friend = await this.repository.findOne({
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
    return friend;
  }

  /** 친구요청
   * 친구 요청을 보냅니다. 테이블에 생성하는 부분
   */
  async saveFriendStatusRequestingBySenderIdAndReceiverId(
    userId: number,
    friendId: number,
  ): Promise<void> {
    await this.repository.save({
      sender: { id: userId },
      receiver: { id: friendId },
      status: FRIENDSTATUS_REQUESTING,
    });
  }

  /** 친구수락
   * 친구 요청을 수락합니다. 테이블에 업데이트하는 부분
   */
  async updateFriendRequestStatusFriendBySenderIdAndReceiverId(
    senderId: number,
    receiverId: number,
  ): Promise<void> {
    await this.repository.update(
      {
        sender: { id: senderId },
        receiver: { id: receiverId },
      },
      { status: FRIENDSTATUS_FRIEND },
    );
  }

  /** 친구 삭제 및 거절
   * 친구 요청을 거절합니다. 테이블에 업데이트하는 부분
   */
  async updateFriendRequestStatusDeletedBySenderIdAndReceiverId(
    senderId: number,
    receiverId: number,
  ): Promise<void> {
    await this.repository.update(
      {
        sender: { id: senderId },
        receiver: { id: receiverId },
      },
      { status: FRIENDSTATUS_DELETED },
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
