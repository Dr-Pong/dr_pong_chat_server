export class DirectMessageRoomInfoDto {
  nickname: string;
  imgUrl: string;
  newChats: number;
}

export class DirectMessageRoomsDto {
  chatList: DirectMessageRoomInfoDto[];
}
