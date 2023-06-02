import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/domain/channel/channel.entity';
import { ChannelFactory } from 'src/domain/factory/channel.factory';
import { UserFactory } from 'src/domain/factory/user.factory';
import { Repository } from 'typeorm';
import { ChannelUser } from '../channel-user.entity';
import { User } from 'src/domain/user/user.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ChannelMessage } from 'src/domain/channel-message/channel-message.entity';
import { ChannelModel } from 'src/domain/factory/model/channel.model';
import { v4 as uuid } from 'uuid';
import { CHANNEL_PUBLIC } from 'src/global/type/type.channel';
import { UserModel } from 'src/domain/factory/model/user.model';

@Injectable()
export class TestService {
  constructor(
    private readonly channelFactory: ChannelFactory,
    private readonly userFactory: UserFactory,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelUser)
    private readonly channelUserRepository: Repository<ChannelUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private readonly imageRepository: Repository<ProfileImage>,
    @InjectRepository(ChannelMessage)
    private readonly messageRepository: Repository<ChannelMessage>,
  ) {}

  async createBasicChannel(
    name: string,
    userNum: number,
  ): Promise<ChannelModel> {
    const owner: User = await this.userRepository.save({
      nickname: 'owner' + name,
      image: await this.imageRepository.save({
        url: 'https://avatars.githubusercontent.com/u/48426991?v=4',
      }),
    });
    const ownerModel: UserModel = UserModel.fromEntity(owner);
    this.userFactory.create(ownerModel);
    const channel: Channel = await this.channelRepository.save({
      operator: owner,
      name: name,
      maxHeadCount: 10,
      headCount: 1,
      password: null,
      type: CHANNEL_PUBLIC,
    });
    await this.channelUserRepository.save({
      user: owner,
      channel: channel,
    });
    const channelModel: ChannelModel = ChannelModel.fromEntity(channel);
    this.channelFactory.create(owner.id, channelModel);
    for (let i = 0; i < userNum; i++) {
      const user: User = await this.userRepository.save({
        nickname: 'nick' + name + i.toString(),
        image: await this.imageRepository.save({
          url: 'https://avatars.githubusercontent.com/u/48426991?v=4',
        }),
      });
      const userModel: UserModel = UserModel.fromEntity(user);
      this.userFactory.create(userModel);
      this.channelFactory.join(user.id, channel.id);
      await this.channelUserRepository.save({
        user: user,
        channel: channel,
      });
    }
    return this.channelFactory.findById(channel.id);
  }

  async createBasicChannels(): Promise<void> {
    for (let i = 1; i < 10; i++) {
      await this.createBasicChannel('name' + i.toString(), i);
    }
  }

  async createBasicUser(nickname: string): Promise<UserModel> {
    const user: User = await this.userRepository.save({
      nickname: nickname,
      image: await this.imageRepository.save({
        url: 'https://avatars.githubusercontent.com/u/48426991?v=4',
      }),
    });
    const userModel: UserModel = UserModel.fromEntity(user);
    this.userFactory.create(userModel);
    return this.userFactory.findById(user.id);
  }

  async createChannelWithAdmins(): Promise<ChannelModel> {
    const channel: ChannelModel = await this.createBasicChannel('admins', 9);
    channel.users.forEach((userId) => {
      if (channel.ownerId !== userId) {
        this.channelFactory.setAdmin(userId, channel.id);
      }
    });
    return this.channelFactory.findById(channel.id);
  }
}
