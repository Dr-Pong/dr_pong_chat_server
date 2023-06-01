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
import {
  CHANNEL_PRIVATE,
  CHANNEL_PROTECTED,
} from 'src/global/type/type.channel';
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
import { ChannelPageDto, ChannelPageDtos } from './dto/channel.page.dto';
import { Page } from 'src/global/utils/page';
import { FindChannelPageDto } from './dto/find.channel.page.dto';
import { PostChannelDto } from './dto/post.channel.dto';
import { SaveChannelDto } from '../channel/dto/save.channel.dto';
import { SaveChannelUserDto } from './dto/save.channel-user.dto';
import { PostChannelJoinDto } from './dto/post.channel.join.dto';
import { validateChannelJoin } from './channel-user.error';

@Injectable()
export class ChannelUserService {
  constructor(
    private readonly channelUserRepository: ChannelUserRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly userRepository: UserRepository,
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
      await this.exitChannel(existChannelUser);
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
      await this.exitChannel(existChannelUser);
    }

    await this.joinChannel(postDto);

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
}
