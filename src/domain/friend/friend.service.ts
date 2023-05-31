import { Injectable } from '@nestjs/common';
import { FriendRepository } from './friend.repository';
import { UserFactory } from '../user/user.factory';
import { GetUserFriendDto } from './dto/get.user.friend.dto';
import { FriendDto, UserFriendsDto } from './dto/user.friends.dto';
import { Friend } from './friend.entity';
import { PostUserFriendRequestDto } from './dto/post.user.friend.request.dto';
import { FRIENDSTATUS_DELETED } from 'src/global/type/type.friend.status';

@Injectable()
export class FriendService {
  constructor(
    private friendRepository: FriendRepository,
    private userFactory: UserFactory,
  ) {}

  //**친구 목록 GET 반환 */
  async getUserFriends(getDto: GetUserFriendDto): Promise<UserFriendsDto> {
    const userFriends: Friend[] = await this.friendRepository.findFriendsById(
      getDto.userId,
    );
    const friends: FriendDto[] = userFriends.map((friend) => {
      if (friend.friend.id === getDto.userId) {
        return {
          nickname: friend.user.nickname,
          imgUrl: friend.user.image.url,
        };
      }
      return {
        nickname: friend.friend.nickname,
        imgUrl: friend.friend.image.url,
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

  //**친구 추가 */
  async postUserFriendRequest(
    postDto: PostUserFriendRequestDto,
  ): Promise<void> {
    const friendTables: Friend[] = await this.friendRepository.findFriendTables(
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
      await this.friendRepository.saveFriendRequest(
        postDto.userId,
        postDto.friendId,
      );
    }
  }
}
