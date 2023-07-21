interface Invitation {
  id: string;
  channelId: string;
  channelName: string;
  from: string;
  createdAt: Date;
}

export default class ChannelInviteListResponseDto {
  invitations: Invitation[];
}
