import { Injectable } from '@nestjs/common';
import { FriendRepository } from './friend.repository';
import { UserFactory } from '../user/user.factory';
import { GetUserFriendDto } from './dto/get.user.friend.dto';
import { UserFriendsDto } from './dto/user.friends.dto';
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
    const friends = userFriends.map((friend) => {
      return {
        nickname: friend.friend.nickname,
        imgUrl: friend.friend.image.url,
      };
    });

    const responseDto: UserFriendsDto = {
      friends: friends,
    };

    return responseDto;
  }
}
