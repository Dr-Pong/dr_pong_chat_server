import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChannelUserRepository } from './channel-user.repository';
import { ChannelRepository } from '../channel/channel.repository';
import { Channel } from '../channel/channel.entity';
import { ChannelFactory } from '../channel/channel.factory';
import { ChannelModel } from '../channel/channel.model';
import { UserModel } from '../user/user.model';
import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
} from 'typeorm-transactional';
import { UserFactory } from '../user/user.factory';
import { ChannelUser } from './channel-user.entity';
import { User } from '../user/user.entity';
import { ChannelJoinDto } from './dto/channel.join.dto';
import { PostChannelAcceptInviteDto } from './dto/post.channel.accept.invite.dto';
import { UpdateChannelHeadCountDto } from './dto/update.channel.headcount.dto';
import { GetChannelParticipantsDto } from './dto/get.channel-participants.dto';
import {
  ChannelParticipantDto,
  ChannelParticipantDtos,
} from './dto/channel-participant.dto';
import { ChannelMeDto } from './dto/channel.me.dto';
import { GetChannelMyDto } from './dto/get.channel.my.dto';
import { GetChannelPageDto } from './dto/get.channel.page.dto';
import { ChannelPageDtos } from './dto/channel.page.dto';
import { Page } from 'src/global/utils/page';
import { FindChannelPageDto } from './dto/find.channel.page.dto';
import { PostChannelDto } from './dto/post.channel.dto';
import { SaveChannelDto } from '../channel/dto/save.channel.dto';
import { SaveChannelUserDto } from './dto/save.channel-user.dto';
import { PostChannelJoinDto } from './dto/post.channel.join.dto';
import {
  checkUserInChannel,
  checkUserExist,
  validateChannelJoin,
  checkUserIsInvited,
  checkChannelExist,
} from './channel-user.error';
import { PostInviteDto } from './dto/post.invite.dto';
import { InviteModel } from '../user/invite.model';
import {
  JOIN_CHANNEL_INVITE,
  JOIN_CHANNEL_JOIN,
} from 'src/global/type/type.join.channel';
import { ChannelExitDto } from './dto/channel.exit.dto';
import { DeleteChannelUserDto } from './dto/delete.channel.user.dto';

@Injectable()
export class ChannelUserService {
  constructor(
    private readonly channelUserRepository: ChannelUserRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly messageRepository: ChannelMessageRepository,
    private readonly channelFactory: ChannelFactory,
    private readonly userFactory: UserFactory,
  ) {}

  getChannelParticipants(
    getDto: GetChannelParticipantsDto,
  ): ChannelParticipantDtos {
    const channel: ChannelModel = this.channelFactory.findChannelById(
      getDto.channelId,
    );
    const users: UserModel[] = this.channelFactory.getUsers(channel);
    checkUserInChannel(channel, getDto.userId);

    const responseDto: ChannelParticipantDtos = new ChannelParticipantDtos();
    users.map((user) => {
      if (user.id === getDto.userId) {
        responseDto.me = ChannelParticipantDto.fromModel(user);
      } else {
        responseDto.participants.push(ChannelParticipantDto.fromModel(user));
      }
    });
    return responseDto;
  }

  getChannelMy(getDto: GetChannelMyDto): ChannelMeDto {
    const user: UserModel = this.userFactory.findById(getDto.userId);
    const channel: ChannelModel = this.channelFactory.findChannelById(
      user.joinedChannel,
    );

    return ChannelMeDto.fromModel(channel);
  }

  async getChannelPages(getDto: GetChannelPageDto): Promise<ChannelPageDtos> {
    let channels: Page<Channel[]>;
    if (getDto.orderBy === 'createAt') {
      channels = await this.channelRepository.findChannelByPagesOrderByCreateAt(
        FindChannelPageDto.fromGetDto(getDto),
      );
    }
    if (getDto.orderBy === 'popular') {
      channels =
        await this.channelRepository.findChannelByPagesOrderByHeadCount(
          FindChannelPageDto.fromGetDto(getDto),
        );
    }

    const responseDto: ChannelPageDtos = ChannelPageDtos.fromPage(channels);

    return responseDto;
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannel(postDto: PostChannelDto): Promise<void> {
    const existChannel: Channel =
      await this.channelRepository.findByChannelName(postDto.name);
    if (existChannel) {
      throw new BadRequestException('Channel name already exists');
    }

    const existChannelUser: ChannelUser =
      await this.channelUserRepository.findByUserIdAndNotDeleted(
        postDto.userId,
      );
    if (existChannelUser) {
      await this.exitChannel(
        new ChannelExitDto(postDto.userId, existChannelUser.channel.id),
      );
    }

    const user: User = await this.userRepository.findById(postDto.userId);
    const newChannel: Channel = await this.channelRepository.saveChannel(
      SaveChannelDto.from(postDto),
    );
    await this.channelUserRepository.saveChannelUser(
      new SaveChannelUserDto(user.id, newChannel.id),
    );

    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(postDto.userId);
      if (userModel.joinedChannel) {
        this.channelFactory.leave(
          userModel,
          this.channelFactory.channels.get(userModel.joinedChannel),
        );
      }
      this.channelFactory.create(
        userModel,
        ChannelModel.fromEntity(newChannel),
      );
    });
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannelJoin(postDto: PostChannelJoinDto): Promise<void> {
    const existChannelUser: ChannelUser =
      await this.channelUserRepository.findByUserIdAndNotDeleted(
        postDto.userId,
      );
    if (existChannelUser) {
      await this.exitChannel(
        new ChannelExitDto(postDto.userId, existChannelUser.channel.id),
      );
    }

    await this.joinChannel(
      new ChannelJoinDto(
        postDto.userId,
        postDto.channelId,
        postDto.password,
        JOIN_CHANNEL_JOIN,
      ),
    );

    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(postDto.userId);
      if (userModel.joinedChannel) {
        this.channelFactory.leave(
          userModel,
          this.channelFactory.channels.get(userModel.joinedChannel),
        );
      }
      this.channelFactory.join(
        userModel,
        this.channelFactory.findChannelById(postDto.channelId),
      );
    });
  }

  postInvite(postDto: PostInviteDto): void {
    const channel: ChannelModel = this.channelFactory.channels.get(
      postDto.channelId,
    );
    checkChannelExist(channel);

    const host: UserModel = this.userFactory.findById(postDto.userId);
    const target: UserModel = this.userFactory.findById(postDto.tragetId);
    checkUserExist(host);
    checkUserExist(target);

    const invite: InviteModel = new InviteModel(
      channel.id,
      channel.name,
      host.nickname,
    );

    this.userFactory.invite(target, invite);
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannelAcceptInvite(
    postDto: PostChannelAcceptInviteDto,
  ): Promise<void> {
    const user: UserModel = this.userFactory.findById(postDto.userId);
    checkUserIsInvited(user, postDto.inviteId);

    const existChannelUser: ChannelUser =
      await this.channelUserRepository.findByUserIdAndNotDeleted(
        postDto.userId,
      );
    if (existChannelUser) {
      await this.exitChannel(
        new ChannelExitDto(postDto.userId, existChannelUser.channel.id),
      );
    }

    this.joinChannel(
      new ChannelJoinDto(
        postDto.userId,
        user.inviteList.get(postDto.inviteId).channelId,
        null,
        JOIN_CHANNEL_INVITE,
      ),
    );

    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(postDto.userId);
      if (userModel.joinedChannel) {
        this.channelFactory.leave(
          userModel,
          this.channelFactory.channels.get(userModel.joinedChannel),
        );
      }
      this.channelFactory.join(
        user,
        this.channelFactory.channels.get(
          user.inviteList.get(postDto.inviteId).channelId,
        ),
      );
      user.inviteList.delete(postDto.inviteId);
    });
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteChannelUser(deleteDto: DeleteChannelUserDto): Promise<void> {
    const channelUser: ChannelUser =
      await this.channelUserRepository.findByUserIdAndChannelId(
        deleteDto.userId,
        deleteDto.channelId,
      );
    if (!channelUser) {
      throw new BadRequestException('User is not joined channel');
    }

    await this.exitChannel(
      new ChannelExitDto(deleteDto.userId, channelUser.channel.id),
    );

    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(deleteDto.userId);
      this.channelFactory.leave(
        userModel,
        this.channelFactory.findChannelById(deleteDto.channelId),
      );
    });
  }

  private async joinChannel(dto: ChannelJoinDto): Promise<void> {
    await validateChannelJoin(
      dto,
      this.channelRepository,
      this.channelUserRepository,
    );

    await this.channelUserRepository.saveChannelUser(
      new SaveChannelUserDto(dto.userId, dto.channelId),
    );
    await this.channelRepository.updateHeadCount(
      new UpdateChannelHeadCountDto(dto.channelId, 1),
    );
  }

  private async exitChannel(dto: ChannelExitDto): Promise<void> {
    await this.channelUserRepository.deleteChannelUser(
      dto.userId,
      dto.channelId,
    );
    await this.channelRepository.updateHeadCount(
      new UpdateChannelHeadCountDto(dto.channelId, -1),
    );
  }
}
