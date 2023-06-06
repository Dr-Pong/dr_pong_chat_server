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
   * 주의: 친구 status구분 안하고 그냥 다가져옵니다.
   * @param userId - 사용자의 id
   * @returns Promise<Friend[]> - 사용자의 친구 목록을 담은 DTO를 Promise로 반환합니다.
   * */
  async findFriendsByUserId(userId: number): Promise<Friend[]> {
    const friends: Friend[] = await this.repository.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
    });
    return friends;
  }

  /**친구 목록
   * 유저와 친구의 id로 둘이 테이블에 존재하는지 가져옵니다
   * 주의: 친구 status구분 안하고 그냥 다가져옵니다.
   * @param userId - 사용자의 id
   * @param friendId - 친구의 id
   * @returns Promise<Friend[]> - 사용자의 친구 목록을 담은 DTO를 Promise로 반환합니다.
   * @todo 친구 삭제, 추가, 수락, 요청에 다사용하니까 변수명 수정해주세요 friendLogs가 어떨까요?
   */
  async findAllFriendsByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<Friend[]> {
    const deletedFriends: Friend[] = await this.repository.find({
      where: [{ sender: { id: userId }, receiver: { id: friendId } }],
    });
    return deletedFriends;
  }

  /** 친구요청
   * 친구 요청을 보냅니다. 테이블에 생성하는 부분
   * @param userId - 사용자의 id
   * @param friendId - 친구의 id
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

  //이함수 삭제해주세요 findFriendsByUserId 와 같습니다.
  async findAllFriendsStatusPendingByUserId(userId: number): Promise<Friend[]> {
    const pendingFriends: Friend[] = await this.repository.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
    });
    return pendingFriends;
  }

  /** 친구수락
   * 친구 요청을 수락합니다. 테이블에 업데이트하는 부분
   * @param userId - 사용자의 id
   * @param friendId - 친구의 id
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
   * @param userId - 사용자의 id
   * @param friendId - 친구의 id
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
