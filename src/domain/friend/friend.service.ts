import { Injectable } from '@nestjs/common';
import { FriendRepository } from './friend.repository';
import { UserFactory } from '../user/user.factory';
import { GetUserFriendDto } from './dto/get.user.friend.dto';
import { FriendDto, UserFriendsDto } from './dto/user.friends.dto';
import { Friend } from './friend.entity';

@Injectable()
export class FriendService {
  constructor(
    private friendRepository: FriendRepository,
    private userFactory: UserFactory,
  ) {}

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
}
