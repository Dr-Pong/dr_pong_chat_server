import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
} from 'typeorm-transactional';
import { GetIdFromNicknameDto } from './dto/get.id.from.nickname.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { PatchUserImageDto } from './dto/patch.user.image.dto';
import { ProfileImageRepository } from '../profile-image/profile-image.repository';
import { NotificationGateWay } from 'src/gateway/notification.gateway';
import {
  USERSTATUS_INGAME,
  USERSTATUS_ONLINE,
} from 'src/global/type/type.user.status';
import { GameModel } from '../factory/model/game.model';
import { GameMode, GameType } from '../../global/type/type.game';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly friendRepository: FriendRepository,
    private readonly blockRepository: BlockRepository,
    private readonly userFactory: UserFactory,
    private readonly profileImageRepository: ProfileImageRepository,
    private readonly notificationGateway: NotificationGateWay,
  ) {}

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getIdFromNickname(getDto: GetIdFromNicknameDto): Promise<UserIdDto> {
    const { nickname } = getDto;
    const user = await this.userRepository.findByNickname(nickname);
    if (!user) throw new BadRequestException('No such User');
    return { id: user.id };
  }

  @Transactional({ isolationLevel: IsolationLevel.SERIALIZABLE })
  async postUser(postDto: PostGatewayUserDto): Promise<void> {
    const user: User = await this.userRepository.save(postDto);
    runOnTransactionComplete(async () => {
      this.userFactory.create(UserModel.fromEntity(user));
    });
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserRelation(getDto: GetUserRelationDto): Promise<UserRelationDto> {
    const { userId, targetId } = getDto;
    const isMe: boolean = userId === targetId;
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
    return new UserRelationDto(isFriend, isBlock, isMe);
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async patchUserImage(patchDto: PatchUserImageDto): Promise<void> {
    const user = await this.userRepository.findById(patchDto.userId);
    if (!user) throw new NotFoundException('No such User');
    const image = await this.profileImageRepository.findById(patchDto.imgId);
    if (!image) throw new NotFoundException('No such Image');

    await this.userRepository.updateUserImage(user.id, image);

    runOnTransactionComplete(async () => {
      this.userFactory.updateProfile(user.id, image.url);
    });
  }

  async patchUserStateInGame(
    userId: number,
    gameId: string,
    type: GameType,
    mode: GameMode,
  ): Promise<void> {
    this.userFactory.setGame(userId, new GameModel(gameId, type, mode));
    this.userFactory.setStatus(userId, USERSTATUS_INGAME);
    await this.notificationGateway.sendStatusToFriends(userId);
  }

  async patchUserStateOutGame(userId: number): Promise<void> {
    const user: UserModel = this.userFactory.findById(userId);
    this.userFactory.setGame(userId, null);
    if (user.notificationSocket.size) {
      this.userFactory.setStatus(userId, USERSTATUS_ONLINE);
    }
    await this.notificationGateway.sendStatusToFriends(userId);
  }
}
