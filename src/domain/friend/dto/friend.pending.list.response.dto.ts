interface User {
  nickname: string;
  imgUrl: string;
}
export class FriendPendingListResponseDto {
  users: User[];
}