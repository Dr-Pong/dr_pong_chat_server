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
import { BlockRepository } from './domain/block/block.repository';
import { Block } from './domain/block/block.entity';
import { ProfileImageRepository } from './domain/profile-image/profile-image.repository';
import { ProfileImage } from './domain/profile-image/profile-image.entity';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly userRepository: UserRepository,
    private readonly imageRepository: ProfileImageRepository,
    private readonly channelUserRepository: ChannelUserRepository,
    private readonly blockRepository: BlockRepository,
    private readonly channelFactory: ChannelFactory,
    private readonly userFactory: UserFactory,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const images: ProfileImage[] = await this.imageRepository.findAll();
    if (images.length === 0) {
      for (let i = 1; i <= 8; i++) {
        await this.imageRepository.save({
          id: i,
          url:
            'https://drpong.s3.ap-northeast-2.amazonaws.com/fishes/' +
            i.toString() +
            '.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    const channels: Channel[] = await this.channelRepository.findAll();
    const users: User[] = await this.userRepository.findAll();
    const channelUsers: ChannelUser[] =
      await this.channelUserRepository.findAll();
    const paneltyUsers: ChannelUser[] =
      await this.channelUserRepository.findAllPaneltyUsers();
    const blocked: Block[] = await this.blockRepository.findAll();

    users.forEach((user) => {
      this.userFactory.users.set(user.id, UserModel.fromEntity(user));
    });

    blocked.forEach((block) => {
      this.userFactory.block(block.user.id, block.blockedUser.id);
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
