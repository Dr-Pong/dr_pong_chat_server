import { ChannelParticipantDto } from './channel-participant.dto';

export class ChannelParticipantsResponseDto {
  me: ChannelParticipantDto;
  participants: ChannelParticipantDto[] = [];
  headCount: number;
  maxCount: number;
}
