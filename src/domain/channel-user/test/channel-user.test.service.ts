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
import {
  CHANNEL_PRIVATE,
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
  ChannelType,
} from 'src/global/type/type.channel';
import { UserModel } from 'src/domain/factory/model/user.model';
import { InviteModel } from 'src/domain/factory/model/invite.model';
import { CHAT_MUTE } from 'src/global/type/type.chat';

@Injectable()
export class ChannelUserTestService {
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

  async createChannel(
    owner: UserModel,
    name: string,
    type: ChannelType,
  ): Promise<ChannelModel> {
    const channel: Channel = await this.channelRepository.save({
      operator: { id: owner.id },
      name: name,
      maxHeadCount: 10,
      headCount: 1,
      password: type === CHANNEL_PROTECTED ? 'password' : null,
      type: type,
    });
    await this.channelUserRepository.save({
      user: { id: owner.id },
      channel: channel,
    });
    const channelModel: ChannelModel = ChannelModel.fromEntity(channel);
    this.channelFactory.create(owner.id, channelModel);
    return this.channelFactory.findById(channel.id);
  }

  async createUser(nickname: string): Promise<UserModel> {
    const user: User = await this.userRepository.save({
      nickname: nickname,
      image: await this.imageRepository.save({
        url: 'https://avatars.githubusercontent.com/u/48426991?v=4',
      }),
    });
    const ownerModel: UserModel = UserModel.fromEntity(user);
    this.userFactory.create(ownerModel);
    return this.userFactory.findById(user.id);
  }

  async createBasicChannel(
    name: string,
    userNum: number,
  ): Promise<ChannelModel> {
    const owner: UserModel = await this.createUser('owner' + name);
    const channel: ChannelModel = await this.createChannel(
      owner,
      name,
      CHANNEL_PUBLIC,
    );
    for (let i = 1; i < userNum; i++) {
      const user: UserModel = await this.createUser('nick' + i + name);
      this.channelFactory.join(user.id, channel.id);
      await this.channelUserRepository.save({
        user: user,
        channel: channel,
      });
      await this.channelRepository.update(
        { id: channel.id },
        { headCount: i + 1 },
      );
    }
    return this.channelFactory.findById(channel.id);
  }

  async createProtectedChannel(
    name: string,
    userNum: number,
  ): Promise<ChannelModel> {
    const owner: UserModel = await this.createUser('owner' + name);
    const channel: ChannelModel = await this.createChannel(
      owner,
      name,
      CHANNEL_PROTECTED,
    );
    for (let i = 1; i < userNum; i++) {
      const user: UserModel = await this.createUser('nick' + i + name);
      this.channelFactory.join(user.id, channel.id);
      await this.channelUserRepository.save({
        user: user,
        channel: channel,
      });
      await this.channelRepository.update(
        { id: channel.id },
        { headCount: i + 1 },
      );
    }
    return this.channelFactory.findById(channel.id);
  }

  async createPrivateChannel(name: string, userNum: number) {
    const owner: UserModel = await this.createUser('owner' + name);
    const channel: ChannelModel = await this.createChannel(
      owner,
      name,
      CHANNEL_PRIVATE,
    );
    for (let i = 1; i < userNum; i++) {
      const user: UserModel = await this.createUser('nick' + i + name);
      this.channelFactory.join(user.id, channel.id);
      await this.channelUserRepository.save({
        user: user,
        channel: channel,
      });
      await this.channelRepository.update(
        { id: channel.id },
        { headCount: i + 1 },
      );
    }
    return this.channelFactory.findById(channel.id);
  }

  async createBasicChannels(): Promise<void> {
    for (let i = 1; i < 10; i++) {
      await this.createBasicChannel('name' + i.toString(), i);
    }
  }

  async createBasicUser(nickname: string): Promise<UserModel> {
    return await this.createUser(nickname);
  }

  async createChannelWithAdmins(userNum: number): Promise<ChannelModel> {
    const channel: ChannelModel = await this.createBasicChannel(
      'admins',
      userNum,
    );
    channel.users.forEach((userId) => {
      if (channel.ownerId !== userId) {
        this.channelFactory.setAdmin(userId, channel.id);
      }
    });
    return this.channelFactory.findById(channel.id);
  }

  async createChannelWithMutedAdmins(userNum: number): Promise<ChannelModel> {
    const channel: ChannelModel = await this.createChannelWithAdmins(userNum);
    channel.users.forEach((userId) => {
      if (channel.ownerId !== userId) {
        this.channelFactory.setMute(userId, channel.id);
      }
    });
    return this.channelFactory.findById(channel.id);
  }

  async createBannedChannel(user: UserModel): Promise<ChannelModel> {
    const channel: ChannelModel = await this.createBasicChannel('banned', 9);
    this.channelFactory.setBan(user.id, channel.id);
    await this.channelUserRepository.save({
      user: { id: user.id },
      channel: { id: channel.id },
      isDeleted: true,
    });
    return this.channelFactory.findById(channel.id);
  }

  async createInvitePendingUser(): Promise<UserModel> {
    const user: UserModel = await this.createUser('user');
    for (let i = 1; i < 10; i++) {
      const channel: ChannelModel = await this.createBasicChannel(
        'name' + i.toString(),
        i,
      );
      const invite: InviteModel = new InviteModel(
        channel.id,
        channel.name,
        this.userFactory.findById(channel.ownerId).nickname,
      );
      this.userFactory.invite(user.id, invite);
    }
    return this.userFactory.findById(user.id);
  }

  async createUserInChannel(userNum: number): Promise<UserModel> {
    const channel: ChannelModel = await this.createBasicChannel(
      'channel',
      userNum,
    );
    const iterator = channel.users.values();
    iterator.next();
    const user: UserModel = this.userFactory.findById(iterator.next().value);
    return user;
  }

  async createMutedUserInChannel(userNum: number): Promise<UserModel> {
    const channel: ChannelModel = await this.createBasicChannel(
      'channel',
      userNum,
    );
    channel.users.values().next();
    const user: UserModel = this.userFactory.findById(
      channel.users.values().next().value,
    );
    this.channelFactory.setMute(user.id, channel.id);
    await this.messageRepository.save({
      user: { id: user.id },
      channel: { id: channel.id },
      content: 'muted',
      time: new Date(),
      type: CHAT_MUTE,
    });
    return user;
  }
}
