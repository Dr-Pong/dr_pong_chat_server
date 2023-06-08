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
      where: [
        { sender: { id: userId }, status: FRIENDSTATUS_REQUESTING },
        { receiver: { id: userId }, status: FRIENDSTATUS_REQUESTING },
      ],
    });
    return friends;
  }

  /**친구 요청 목록
   * 사용자의 친구 요청목록을 가져옵니다.
   * */
  async countFriendRequestingsByUserId(userId: number): Promise<number> {
    const friendCount: number = await this.repository.count({
      where: [
        { sender: { id: userId }, status: FRIENDSTATUS_REQUESTING },
        { receiver: { id: userId }, status: FRIENDSTATUS_REQUESTING },
      ],
    });
    return friendCount;
  }

  /**delete가 아닌 친구 테이블 목록
   * 유저와 친구의 id로 둘이 테이블에 delete가 아닌 Frined[]를 반환합니다.
   */
  async checkIsFriendOrRequestingByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<boolean> {
    const isFriendOrRequesting: boolean = await this.repository.exist({
      where: [
        {
          sender: { id: userId },
          receiver: { id: friendId },
          status: In([FRIENDSTATUS_FRIEND, FRIENDSTATUS_REQUESTING]),
        },
      ],
    });
    return isFriendOrRequesting;
  }

  /**친구 requesting 테이블 목록
   * 유저와 친구의 id로 둘이 테이블에 requesting인 Frined[]를 반환합니다.
   */
  async checkIsRequestingByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<boolean> {
    const isRequesting: boolean = await this.repository.exist({
      where: [
        {
          sender: { id: userId },
          receiver: { id: friendId },
          status: FRIENDSTATUS_REQUESTING,
        },
      ],
    });
    return isRequesting;
  }

  /**친구 테이블 목록
   * 유저와 친구의 id로 둘이 테이블에 friend인 Frined[]를 반환합니다.
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
      ],
    });
    return isFriend;
  }

  /** 친구요청
   * 친구 요청을 보냅니다. 테이블에 생성하는 부분
   */
  async saveFriendStatusRequestingByUserIdAndFriendId(
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
  async updateFriendRequestStatusFriendByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<void> {
    await this.repository.update(
      {
        sender: { id: In([userId, friendId]) },
        receiver: { id: In([userId, friendId]) },
      },
      { status: FRIENDSTATUS_FRIEND },
    );
  }

  /** 친구삭제및 거절
   * 친구 요청을 거절합니다. 테이블에 업데이트하는 부분
   */
  async updateFriendRequestStatusDeletedByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<void> {
    await this.repository.update(
      {
        sender: { id: In([userId, friendId]) },
        receiver: { id: In([userId, friendId]) },
      },
      { status: FRIENDSTATUS_DELETED },
    );
  }
}
