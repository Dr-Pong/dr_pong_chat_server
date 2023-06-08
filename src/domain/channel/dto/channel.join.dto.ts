import { JoinChannelType } from 'src/domain/channel/type/type.join.channel';

export class ChannelJoinDto {
  userId: number;
  channelId: string;
  password: string;
  joinType: JoinChannelType;

  constructor(
    userId: number,
    channelId: string,
    password: string,
    joinType: JoinChannelType,
  ) {
    this.userId = userId;
    this.channelId = channelId;
    this.password = password;
    this.joinType = joinType;
  }
}
