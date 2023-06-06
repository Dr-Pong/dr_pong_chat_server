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
   * @param getDto - 사용자의 친구 목록을 가져오기 위한 DTO
   * @returns Promise<UserFriendsDto> - 사용자의 친구 목록을 담은 DTO를 Promise로 반환합니다.
   *
   * @todo 친구 목록을 가져올 때, status가 친구인경우만 추가합니다..filter사용해서 추가해주세요
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserFriends(getDto: GetUserFriendDto): Promise<UserFriendsDto> {
    const userFriends: Friend[] =
      await this.friendRepository.findFriendsByUserId(getDto.userId);
    const friends: FriendDto[] = userFriends.map((friend) => {
      if (friend.receiver.id === getDto.userId) {
        return {
          nickname: friend.sender.nickname,
          imgUrl: friend.sender.image.url,
        };
      }
      return {
        nickname: friend.receiver.nickname,
        imgUrl: friend.receiver.image.url,
      };
    });
    friends.sort((a, b) => {
      if (a.nickname > b.nickname) {
        return 1;
      }
      if (a.nickname < b.nickname) {
        return -1;
      }
      return 0;
    });
    const responseDto: UserFriendsDto = {
      friends: friends,
    };

    return responseDto;
  }

  /**친구 추가
   * 주어진 `postDto.userId`와 `postDto.friendId`를 사용하여 친구 요청을 처리합니다.
   * 친구가 아니거나 친구 요청이 삭제된 경우 친구 요청을 처리합니다.
   * @param postDto - 친구 요청을 처리하기 위한 DTO
   * @returns Promise<void> - 친구 요청을 처리합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postUserFriendRequest(
    postDto: PostUserFriendRequestDto,
  ): Promise<void> {
    const friendTables: Friend[] =
      await this.friendRepository.findAllFriendsByUserIdAndFriendId(
        postDto.userId,
        postDto.friendId,
      );

    let allDeleted = true;

    for (const friend of friendTables) {
      if (friend.status !== FRIENDSTATUS_DELETED) {
        allDeleted = false;
        break;
      }
    }
    if (friendTables.length === 0 || allDeleted) {
      await this.friendRepository.saveFriendStatusRequestingByUserIdAndFriendId(
        postDto.userId,
        postDto.friendId,
      );
    }
  }

  /**친구 요청 목록
   * 사용자의 친구 요청 목록을 nickname을 기준으로 오름차순으로 정렬합니다.
   * @param getDto - 사용자의 친구 요청 목록을 가져오기 위한 DTO (Data Transfer Object)
   * @returns Promise<UserPendingFriendsDto> - 사용자의 친구 요청 목록을 담은 DTO를 Promise로 반환합니다.
   * @todo findFriendsByUserId 이함수 사용해주시고.filter사용해서 추가해주세요
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserPendingFriendRequests(
    getDto: GetUserPendingFriendDto,
  ): Promise<UserPendingFriendsDto> {
    const userFriends: Friend[] =
      await this.friendRepository.findAllFriendsStatusPendingByUserId(
        getDto.userId,
      );

    const friends: FriendDto[] = userFriends.map((friend) => {
      if (friend.receiver.id === getDto.userId) {
        return {
          nickname: friend.sender.nickname,
          imgUrl: friend.sender.image.url,
        };
      }
      return {
        nickname: friend.receiver.nickname,
        imgUrl: friend.receiver.image.url,
      };
    });
    friends.sort((a, b) => {
      if (a.nickname > b.nickname) {
        return 1;
      }
      if (a.nickname < b.nickname) {
        return -1;
      }
      return 0;
    });
    const responseDto: UserPendingFriendsDto = {
      friends: friends,
    };

    return responseDto;
  }

  /**친구 요청 수락
   * 주어진 `postDto.userId`와 `postDto.friendId`를 사용하여 친구 요청을 수락합니다.
   * 요청 상태가 FRIENDSTATUS_REQUESTING 인 경우에만 수락 처리됩니다.
   * @param postDto - 친구 요청 수락을 처리하기 위한 DTO
   * @returns Promise<void> - 친구 요청을 수락합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postUserFriendAccept(postDto: PostUserFriendAcceptDto): Promise<void> {
    const friendTables: Friend[] =
      await this.friendRepository.findAllFriendsByUserIdAndFriendId(
        postDto.userId,
        postDto.friendId,
      );
    let isRequesting = false;

    for (const friend of friendTables) {
      if (friend.status === FRIENDSTATUS_REQUESTING) {
        isRequesting = true;
        break;
      }
    }

    if (isRequesting) {
      await this.friendRepository.updateFriendRequestStatusFriendByUserIdAndFriendId(
        postDto.userId,
        postDto.friendId,
      );
      await this.friendRepository.updateFriendRequestStatusFriendByUserIdAndFriendId(
        postDto.friendId,
        postDto.userId,
      );
    }
  }

  /**  친구요청 거절
   * 주어진 `deleteDto.userId`와 `deleteDto.friendId`를 사용하여 친구 요청을 거절합니다.
   * 요청 상태가 '요청 중'인 경우에만 거절 처리됩니다.
   * @param deleteDto - 친구 요청 거절을 처리하기 위한 DTO
   * @returns Promise<void> - 친구 요청을 거절합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteUserFriendReject(
    deleteDto: DeleteUserFriendRejectDto,
  ): Promise<void> {
    const friendTables: Friend[] =
      await this.friendRepository.findAllFriendsByUserIdAndFriendId(
        deleteDto.userId,
        deleteDto.friendId,
      );
    let isRequesting = false;

    for (const friend of friendTables) {
      if (friend.status === FRIENDSTATUS_REQUESTING) {
        isRequesting = true;
        break;
      }
    }

    if (isRequesting) {
      await this.friendRepository.updateFriendRequestStatusDeletedByUserIdAndFriendId(
        deleteDto.userId,
        deleteDto.friendId,
      );
    }
  }

  /**친구 삭제
   * 주어진 `deleteDto.userId`와 `deleteDto.friendId`를 사용하여 친구를 삭제합니다.
   * 요청 상태가 '친구'인 경우에만 삭제 처리됩니다.
   * @param deleteDto - 친구 삭제를 처리하기 위한 DTO
   * @returns Promise<void> - 친구를 삭제합니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteUserFriend(deleteDto: DeleteUserFriendDto): Promise<void> {
    const friendTables: Friend[] =
      await this.friendRepository.findAllFriendsByUserIdAndFriendId(
        deleteDto.userId,
        deleteDto.friendId,
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
        deleteDto.userId,
        deleteDto.friendId,
      );
      await this.friendRepository.updateFriendRequestStatusDeletedByUserIdAndFriendId(
        deleteDto.friendId,
        deleteDto.userId,
      );
    }
  }

  /** 친구요청 개수
   * 사용자의 친구 요청 개수를 반환합니다.
   * @param getDto - 사용자의 친구 요청 개수를 가져오기 위한 DTO
   * @returns Promise<UserFriendNotificationsDto> - 사용자의 친구 요청 개수를 담은 DTO를 Promise로 반환합니다.
   * @todo findFriendsByUserId 이함수 사용하고 pending인지 filter사용해서 수정
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserFriendNotificationCount(
    getDto: GetUserFriendNotificationsRequestDto,
  ): Promise<UserFriendNotificationsDto> {
    const userFriends: Friend[] =
      await this.friendRepository.findAllFriendsStatusPendingByUserId(
        getDto.userId,
      );

    let friendsCount = userFriends.length;
    if (friendsCount > 50) {
      friendsCount = 50;
    }
    const responseDto: UserFriendNotificationsDto = {
      requestCount: friendsCount,
    };
    return responseDto;
  }
}
