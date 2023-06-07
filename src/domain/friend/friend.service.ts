import { Injectable } from '@nestjs/common';
import { FriendRepository } from './friend.repository';
import { GetUserFriendDto } from './dto/get.user.friend.dto';
import { FriendDto, UserFriendsDto } from './dto/user.friends.dto';
import { Friend } from './friend.entity';
import { PostUserFriendRequestDto } from './dto/post.user.friend.request.dto';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';
import { GetUserPendingFriendDto } from './dto/get.user.peding.friend.dto';
import { UserPendingFriendsDto } from './dto/user.pending.friends.dto';
import { PostUserFriendAcceptDto } from './dto/post.user.friend.accept.dto';
import { DeleteUserFriendRejectDto } from './dto/delete.user.friend.reject.dto';
import { DeleteUserFriendDto } from './dto/delete.user.friend.dto';
import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { GetUserFriendNotificationsRequestDto } from './dto/get.user.friend.notifications.request.dto';
import { UserFriendNotificationsDto } from './dto/user.friend.notifications.dto';

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
    friends.sort(this.compareNicknames);

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
    const friendTables: Friend[] =
      await this.friendRepository.findAllNotDeletedFriendsByUserIdAndFriendId(
        userId,
        friendId,
      );

    if (friendTables.length) return;

    await this.friendRepository.saveFriendStatusRequestingByUserIdAndFriendId(
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
      await this.friendRepository.findFriendRequestingsByUserId(myId);

    const friends: FriendDto[] = userFriends.map((friend) => {
      const { sender, receiver } = friend;
      if (friend.receiver.id === myId) {
        return FriendDto.fromUser(sender);
      }
      return FriendDto.fromUser(receiver);
    });

    friends.sort(this.compareNicknames);

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
    const friendRequestTable: Friend[] =
      await this.friendRepository.findAllFriendRequestsByUserIdAndFriendId(
        userId,
        friendId,
      );

    if (!friendRequestTable.length) return;

    await this.friendRepository.updateFriendRequestStatusFriendByUserIdAndFriendId(
      userId,
      friendId,
    );
    await this.friendRepository.updateFriendRequestStatusFriendByUserIdAndFriendId(
      friendId,
      userId,
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
    const friendTables: Friend[] =
      await this.friendRepository.findAllFriendRequestsByUserIdAndFriendId(
        userId,
        friendId,
      );

    if (friendTables.length > 0) {
      await this.friendRepository.updateFriendRequestStatusDeletedByUserIdAndFriendId(
        userId,
        friendId,
      );
    }
  }

  /**친구 삭제
   * 주어진 `deleteDto.userId`와 `deleteDto.friendId`를 사용하여 친구를 삭제합니다.
   * 요청 상태가 FRIENDSTATUS_FRIEND인 경우에만 삭제 처리됩니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteUserFriend(deleteDto: DeleteUserFriendDto): Promise<void> {
    const { userId, friendId } = deleteDto;
    const friendTables: Friend[] =
      await this.friendRepository.findAllFriendsByUserIdAndFriendId(
        userId,
        friendId,
      );
    let isFriend = false;

    for (const friend of friendTables) {
      if (friend.status === FRIENDSTATUS_FRIEND) {
        isFriend = true;
        break;
      }
    }

    if (isFriend) {
      await this.friendRepository.updateFriendRequestStatusDeletedByUserIdAndFriendId(
        userId,
        friendId,
      );
      await this.friendRepository.updateFriendRequestStatusDeletedByUserIdAndFriendId(
        friendId,
        userId,
      );
    }
  }

  /** 친구요청 개수
   * 사용자의 친구 요청 개수를 반환합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserFriendNotificationCount(
    getDto: GetUserFriendNotificationsRequestDto,
  ): Promise<UserFriendNotificationsDto> {
    const friendsCount: number =
      await this.friendRepository.countFriendRequestingsByUserId(getDto.userId);

    const responseDto: UserFriendNotificationsDto = {
      requestCount: friendsCount > 50 ? 50 : friendsCount,
    };
    return responseDto;
  }

  private compareNicknames = (a, b) => {
    if (a.nickname > b.nickname) {
      return 1;
    }
    if (a.nickname < b.nickname) {
      return -1;
    }
    return 0;
  };
}
