import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { GetIdFromNicknameDto } from './dto/get.id.from.nickname.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserIdDto } from './dto/user.id.dto';
import { UserRepository } from './user.repository';
import { FriendRepository } from '../friend/friend.repository';
import { BlockRepository } from '../block/block.repository';
import { GetUserRelationDto } from './dto/get.user.relation.dto';
import { UserRelationDto } from './dto/user.relation.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly friendRepository: FriendRepository,
    private readonly blockRepository: BlockRepository,
  ) {}

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getIdFromNickname(getDto: GetIdFromNicknameDto): Promise<UserIdDto> {
    const { nickname } = getDto;
    const user = await this.userRepository.findByNickname(nickname);
    if (!user) throw new BadRequestException('No such User');
    return { id: user.id };
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserRelation(getDto: GetUserRelationDto): Promise<UserRelationDto> {
    const { userId, targetId } = getDto;
    const isFriend: boolean =
      await this.friendRepository.checkIsFriendByUserIdAndFriendId(
        userId,
        targetId,
      );
    const isBlock: boolean =
      await this.blockRepository.checkIsBlockByUserIdAndTargetId(
        userId,
        targetId,
      );
    return new UserRelationDto(isFriend, isBlock);
  }
}
