import GameInviteListDto, {
  GameInvitation,
} from 'src/domain/invitation/dto/game.invite.list.dto';

export class NotificationResponseDto {
  invitations: GameInvitation[];

  constructor(invitations: GameInviteListDto) {
    this.invitations = invitations.invitations;
  }
}
