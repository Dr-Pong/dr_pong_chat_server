interface User {
  nickname: string;
  imgUrl: string;
}
export class FriendListResponseDto {
  users: User[];
}
