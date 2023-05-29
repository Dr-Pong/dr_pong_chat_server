export class DirectMessageRoomInfoDto {
  nickname: string;
  imgUrl: string;
  newChat: number;
}

export class GetDirectMessageRoomsResponseDto {
  chats: DirectMessageRoomInfoDto[];
}
