import { BadRequestException, Injectable } from '@nestjs/common';
import { FriendRepository } from './friend.repository';
import { GetUserFriendDto } from './dto/get.user.friend.dto';
import { FriendDto, UserFriendsDto } from './dto/user.friends.dto';
import { Friend } from './friend.entity';
import { PostUserFriendRequestDto } from './dto/post.user.friend.request.dto';
import { GetUserPendingFriendDto } from './dto/get.user.peding.friend.dto';
import { UserPendingFriendsDto } from './dto/user.pending.friends.dto';
import { PostUserFriendAcceptDto } from './dto/post.user.friend.accept.dto';
import { DeleteUserFriendRejectDto } from './dto/delete.user.friend.reject.dto';
import { DeleteUserFriendDto } from './dto/delete.user.friend.dto';
import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { GetUserFriendNotificationsRequestDto } from './dto/get.user.friend.notifications.request.dto';
import { UserFriendNotificationsDto } from './dto/user.friend.notifications.dto';
import { SortUtil } from '../../global/utils/sort.util';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_PENDING,
} from '../../global/type/type.friend.status';

@Injectable()
export class FriendService {
  constructor(private friendRepository: FriendRepository) {}

  /**친구 목록 GET
   * 사용자의 친구 목록을 nickname을 기준으로 오름차순으로 정렬합니다
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserFriends(getDto: GetUserFriendDto): Promise<UserFriendsDto> {
    const { userId: myId } = getDto;
    const userFriends: Friend[] =
      await this.friendRepository.findFriendsByUserId(myId);

    const friends: FriendDto[] = userFriends.map((friend) => {
      const { sender, receiver } = friend;
      if (friend.receiver.id === myId) {
        return FriendDto.fromUser(sender);
      }
      return FriendDto.fromUser(receiver);
    });
    friends.sort(SortUtil.byNicknames);

    const responseDto: UserFriendsDto = {
      friends: friends,
    };
    return responseDto;
  }

  /**친구 추가
   * 주어진 `postDto.userId`와 `postDto.friendId`를 사용하여 친구 요청을 처리합니다.
   * 친구가 아니거나 친구 요청이 삭제된 경우 친구 요청을 처리합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postUserFriendRequest(
    postDto: PostUserFriendRequestDto,
  ): Promise<void> {
    const { userId, friendId } = postDto;
    this.checkIfRequestorIsTarget(userId, friendId);

    const isFriend: boolean =
      await this.friendRepository.checkIsFriendByUserIdAndFriendId(
        userId,
        friendId,
      );
    const isRequesting =
      await this.friendRepository.checkIsPendingBySenderIdAndReceiverId(
        userId,
        friendId,
      );

    if (isFriend || isRequesting) return;

    await this.friendRepository.saveFriendStatusBySenderIdAndReceiverId(
      FRIENDSTATUS_PENDING,
      userId,
      friendId,
    );
  }

  /**친구 요청 목록
   * 사용자의 친구 요청 목록을 nickname을 기준으로 오름차순으로 정렬합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserPendingFriendRequests(
    getDto: GetUserPendingFriendDto,
  ): Promise<UserPendingFriendsDto> {
    const { userId: myId } = getDto;
    const userFriends: Friend[] =
      await this.friendRepository.findPendingsByReceiverId(myId);

    const friends: FriendDto[] = userFriends.map((friend) => {
      const { sender } = friend;
      return FriendDto.fromUser(sender);
    });

    friends.sort(SortUtil.byNicknames);

    const responseDto: UserPendingFriendsDto = {
      friends: friends,
    };
    return responseDto;
  }

  /**친구 요청 수락
   * 주어진 `postDto.userId`와 `postDto.friendId`를 사용하여 친구 요청을 수락합니다.
   * 요청 상태가 FRIENDSTATUS_REQUESTING 인 경우에만 수락 처리됩니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postUserFriendAccept(postDto: PostUserFriendAcceptDto): Promise<void> {
    const { userId, friendId } = postDto;
    this.checkIfRequestorIsTarget(userId, friendId);

    const isRequesting: boolean =
      await this.friendRepository.checkIsPendingBySenderIdAndReceiverId(
        friendId,
        userId,
      );

    if (!isRequesting) return;

    await this.friendRepository.updateFriendStatusFromToBySenderIdAndReceiverId(
      FRIENDSTATUS_PENDING,
      FRIENDSTATUS_FRIEND,
      friendId,
      userId,
    );

    //내가 상대에게 보낸 요청이 남아있으면 삭제
    await this.friendRepository.hardDeleteFriendBySenderIdAndReceiverId(
      userId,
      friendId,
    );
  }

  /**  친구요청 거절
   * 주어진 `deleteDto.userId`와 `deleteDto.friendId`를 사용하여 친구 요청을 거절합니다.
   * 요청 상태가 FRIENDSTATUS_REQUESTING인 경우에만 거절 처리됩니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteUserFriendReject(
    deleteDto: DeleteUserFriendRejectDto,
  ): Promise<void> {
    const { userId, friendId } = deleteDto;
    this.checkIfRequestorIsTarget(userId, friendId);

    const isRequesting: boolean =
      await this.friendRepository.checkIsPendingBySenderIdAndReceiverId(
        friendId,
        userId,
      );

    if (!isRequesting) return;

    await this.friendRepository.updateFriendStatusFromToBySenderIdAndReceiverId(
      FRIENDSTATUS_PENDING,
      FRIENDSTATUS_DELETED,
      friendId,
      userId,
    );
  }

  /**친구 삭제
   * 주어진 `deleteDto.userId`와 `deleteDto.friendId`를 사용하여 친구를 삭제합니다.
   * 요청 상태가 FRIENDSTATUS_FRIEND인 경우에만 삭제 처리됩니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteUserFriend(deleteDto: DeleteUserFriendDto): Promise<void> {
    const { userId, friendId } = deleteDto;
    this.checkIfRequestorIsTarget(userId, friendId);

    const friend: Friend =
      await this.friendRepository.findFriendByUserIdAndFriendId(
        userId,
        friendId,
      );

    if (!friend) return;

    await this.friendRepository.updateFriendStatusFromToBySenderIdAndReceiverId(
      FRIENDSTATUS_FRIEND,
      FRIENDSTATUS_DELETED,
      friend.sender.id,
      friend.receiver.id,
    );
  }

  /** 친구요청 개수
   * 사용자의 친구 요청 개수를 반환합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserFriendNotificationCount(
    getDto: GetUserFriendNotificationsRequestDto,
  ): Promise<UserFriendNotificationsDto> {
    const friendsCount: number =
      await this.friendRepository.countPendingsByReceiverId(getDto.userId);

    const responseDto: UserFriendNotificationsDto = {
      requestCount: friendsCount > 50 ? 50 : friendsCount,
    };
    return responseDto;
  }

  checkIfRequestorIsTarget(requestorId: number, targetId: number): void {
    if (requestorId === targetId)
      throw new BadRequestException('Cannot request yourself');
  }
}
