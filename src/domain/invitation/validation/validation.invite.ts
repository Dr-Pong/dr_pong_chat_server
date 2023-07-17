import { UserModel } from 'src/domain/factory/model/user.model';
import { BadRequestException } from '@nestjs/common';
import { USERSTATUS_INGAME } from 'src/global/type/type.user.status';
import { GameInviteModel } from 'src/domain/factory/model/game.invite.model';

export function validateUser(sendUser: UserModel, receivedUser: UserModel) {
  if (receivedUser === sendUser) {
    throw new BadRequestException('invalid user');
  }
  if (!sendUser || !receivedUser) {
    throw new BadRequestException('invalid user');
  }
}

export function checkAlreadyInvited(receivedUser: UserModel, senderId: number) {
  const invite: GameInviteModel = Array.from(
    receivedUser.gameInviteList.values(),
  ).find((invite) => invite.senderId === senderId);

  if (invite) {
    throw new BadRequestException('already invited');
  }
}

export function checkAlreadyInGame(receivedUser: UserModel) {
  if (receivedUser.status === USERSTATUS_INGAME) {
    throw new BadRequestException('already in game');
  }
}

export function validateInvite(invitation: GameInviteModel) {
  if (!invitation) {
    throw new BadRequestException('invalid invite');
  }
}
