export class DirectMessageRoomInfoDto {
  nickname: string;
  imgUrl: string;
  newChat: number;
}

export class DirectMessageRoomsResponseDto {
  chats: DirectMessageRoomInfoDto[];
}
