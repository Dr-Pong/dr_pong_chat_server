interface ChannelInvitation {
  id: string;
  channelId: string;
  channelName: string;
  from: string;
  createdAt: Date;
}

export default class ChannelInviteListDto {
  invitations: ChannelInvitation[];
}
