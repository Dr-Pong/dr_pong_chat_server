import { User } from '../../user/user.entity';

export class FriendDto {
  nickname: string;
  imgUrl: string;

  static fromUser(user: User) {
    const { nickname, image } = user;
    const imgUrl = image?.url;
    return { nickname, imgUrl };
  }
}

export class UserFriendsDto {
  friends: FriendDto[];
}
