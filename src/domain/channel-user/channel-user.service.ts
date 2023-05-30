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
    if (!channel.users.has(getDto.userId)) {
      throw new BadRequestException('You are not in this channel');
    }

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
}
