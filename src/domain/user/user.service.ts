import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
} from 'typeorm-transactional';
import { GetIdFromNicknameDto } from './dto/get.id.from.nickname.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserIdDto } from './dto/user.id.dto';
import { UserRepository } from './user.repository';
import { PostGatewayUserDto } from './dto/post.gateway.users.dto';
import { UserFactory } from '../factory/user.factory';
import { UserModel } from '../factory/model/user.model';
import { User } from './user.entity';
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
    private readonly userFactory: UserFactory,
  ) {}

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getIdFromNickname(getDto: GetIdFromNicknameDto): Promise<UserIdDto> {
    const { nickname } = getDto;
    const user = await this.userRepository.findByNickname(nickname);
    if (!user) throw new BadRequestException('No such User');
    return { id: user.id };
  }

  @Transactional({ isolationLevel: IsolationLevel.SERIALIZABLE })
  async postGatewayUser(postDto: PostGatewayUserDto): Promise<void> {
    const user: User = await this.userRepository.save(postDto);
    runOnTransactionComplete(async () => {
      await this.userFactory.create(UserModel.fromEntity(user));
    });
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
