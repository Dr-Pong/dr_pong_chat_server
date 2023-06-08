interface DirectMessageRoom {
  nickname: string;
  imgUrl: string;
  newChats: number;
}
export class FriendDirectMessageRoomListResponseDto {
  chatList: DirectMessageRoom[];
}