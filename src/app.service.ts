import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ChannelRepository } from './domain/channel/repository/channel.repository';
import { UserRepository } from './domain/user/user.repository';
import { ChannelUserRepository } from './domain/channel/repository/channel-user.repository';
import { ChannelFactory } from './domain/factory/channel.factory';
import { UserFactory } from './domain/factory/user.factory';
import { User } from './domain/user/user.entity';
import { ChannelUser } from './domain/channel/entity/channel-user.entity';
import { Channel } from './domain/channel/entity/channel.entity';
import { UserModel } from './domain/factory/model/user.model';
import { ChannelModel } from './domain/factory/model/channel.model';
import {
  CHANNEL_PARTICIPANT_ADMIN,
  CHANNEL_PARTICIPANT_OWNER,
} from './domain/channel/type/type.channel-participant';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly userRepository: UserRepository,
    private readonly channelUserRepository: ChannelUserRepository,
    private readonly channelFactory: ChannelFactory,
    private readonly userFactory: UserFactory,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const channels: Channel[] = await this.channelRepository.findAll();
    const users: User[] = await this.userRepository.findAll();
    const channelUsers: ChannelUser[] =
      await this.channelUserRepository.findAll();
    const paneltyUsers: ChannelUser[] =
      await this.channelUserRepository.findAllPaneltyUsers();

    users.forEach((user) => {
      this.userFactory.users.set(user.id, UserModel.fromEntity(user));
    });

    channels.forEach((channel) => {
      this.channelFactory.channels.set(
        channel.id,
        ChannelModel.fromEntity(channel),
      );
    });

    channelUsers.forEach((channelUser) => {
      this.channelFactory.join(channelUser.user.id, channelUser.channel.id);
      if (channelUser.roleType === CHANNEL_PARTICIPANT_OWNER) {
        this.channelFactory.setOwner(
          channelUser.user.id,
          channelUser.channel.id,
        );
      }
      if (channelUser.roleType === CHANNEL_PARTICIPANT_ADMIN) {
        this.channelFactory.setAdmin(
          channelUser.user.id,
          channelUser.channel.id,
        );
      }
    });

    paneltyUsers.forEach((channelUser) => {
      if (channelUser.isBanned) {
        this.channelFactory.setBan(channelUser.user.id, channelUser.channel.id);
      }
      if (channelUser.isMuted) {
        this.channelFactory.setMute(
          channelUser.user.id,
          channelUser.channel.id,
        );
      }
    });
  }
}
