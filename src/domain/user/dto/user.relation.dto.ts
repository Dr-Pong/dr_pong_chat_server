import {
  RELATION_BLOCKED,
  RELATION_FRIEND,
  RELATION_NONE,
  UserRelationType,
} from 'src/global/type/type.user.relation';

export class UserRelationDto {
  status: UserRelationType;

  constructor(
    public readonly isFriend: boolean,
    public readonly isBlock: boolean,
  ) {
    if (isBlock) this.status = RELATION_BLOCKED;
    else if (isFriend) this.status = RELATION_FRIEND;
    else this.status = RELATION_NONE;
  }
}
