export class BlockUserInfoDto {
  nickname: string;
  imgUrl: string;
}

export class UserBlocksDto {
  users: BlockUserInfoDto[];
}
