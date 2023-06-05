interface DmRoom {
  nickname: string;
  imgUrl: string;
  newChats: number;
}
export class FriendDmRoomListResponseDto {
  dmList: DmRoom[];
}