export class FriendDto {
  nickname: string;
  imgUrl: string;
}

export class UserFriendsDto {
  friends: FriendDto[];
}
