import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/domain/channel/entity/channel.entity';
import { ChannelFactory } from 'src/domain/factory/channel.factory';
import { UserFactory } from 'src/domain/factory/user.factory';
import { Repository } from 'typeorm';
import { ChannelUser } from '../../domain/channel/entity/channel-user.entity';
import { User } from 'src/domain/user/user.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { ChannelMessage } from 'src/domain/channel/entity/channel-message.entity';
import { ChannelModel } from 'src/domain/factory/model/channel.model';
import {
  CHANNEL_PRIVATE,
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
  ChannelType,
} from 'src/domain/channel/type/type.channel';
import { UserModel } from 'src/domain/factory/model/user.model';
import { ChannelInviteModel } from 'src/domain/factory/model/channel.invite.model';
import {
  CHAT_JOIN,
  CHAT_LEAVE,
  CHAT_MESSAGE,
  CHAT_MUTE,
  ChannelActionType,
} from 'src/domain/channel/type/type.channel.action';
import { JwtService } from '@nestjs/jwt';
import { UserTestData } from './user.test.data';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChannelTestData {
  constructor(
    private readonly userData: UserTestData,
    private readonly jwtService: JwtService,
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
    ownerId: number,
    name: string,
    type: ChannelType,
  ): Promise<ChannelModel> {
    const channel: Channel = await this.channelRepository.save({
      operator: { id: ownerId },
      name: name,
      maxHeadCount: 10,
      headCount: 1,
      password:
        type === CHANNEL_PROTECTED ? await bcrypt.hash('password', 12) : null,
      type: type,
    });
    await this.channelUserRepository.save({
      user: { id: ownerId },
      channel: channel,
    });
    const channelModel: ChannelModel = ChannelModel.fromEntity(channel);
    this.channelFactory.create(ownerId, channelModel);
    return this.channelFactory.findById(channel.id);
  }

  private async createUser(nickname: string): Promise<UserModel> {
    const user: User = await this.userData.createUser(nickname);
    return this.userFactory.findById(user.id);
  }

  async createBasicChannel(
    name: string,
    userNum: number,
  ): Promise<ChannelModel> {
    const owner: UserModel = await this.createUser('owner' + name);
    const channel: ChannelModel = await this.createChannel(
      owner.id,
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
    }
    await this.channelRepository.update(
      { id: channel.id },
      { headCount: userNum },
    );
    return this.channelFactory.findById(channel.id);
  }

  async createProtectedChannel(
    name: string,
    userNum: number,
  ): Promise<ChannelModel> {
    const owner: UserModel = await this.createUser('owner' + name);
    const channel: ChannelModel = await this.createChannel(
      owner.id,
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
    }
    await this.channelRepository.update(
      { id: channel.id },
      { headCount: userNum },
    );
    return this.channelFactory.findById(channel.id);
  }

  async createPrivateChannel(name: string, userNum: number) {
    const owner: UserModel = await this.createUser('owner' + name);
    const channel: ChannelModel = await this.createChannel(
      owner.id,
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
    }
    await this.channelRepository.update(
      { id: channel.id },
      { headCount: userNum },
    );
    return this.channelFactory.findById(channel.id);
  }

  async createBasicChannels(userNum: number): Promise<void> {
    for (let i = 1; i < userNum; i++) {
      await this.createBasicChannel('name' + i.toString(), i);
    }
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

  async createBannedChannel(userId: number): Promise<ChannelModel> {
    const channel: ChannelModel = await this.createBasicChannel('banned', 9);
    this.channelFactory.setBan(userId, channel.id);
    await this.channelUserRepository.save({
      user: { id: userId },
      channel: { id: channel.id },
      isDeleted: true,
    });
    return this.channelFactory.findById(channel.id);
  }

  async createInvitePendingUser(n: number): Promise<UserModel> {
    const user: UserModel = await this.createUser('user');
    for (let i = 1; i <= n; i++) {
      const channel: ChannelModel = await this.createBasicChannel(
        'name' + i.toString(),
        i,
      );
      const invite: ChannelInviteModel = new ChannelInviteModel(
        channel.id,
        channel.name,
        this.userFactory.findById(channel.ownerId).nickname,
      );
      this.userFactory.inviteChannel(user.id, invite);
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
    const iterator = channel.users.values();
    iterator.next();
    const user: UserModel = this.userFactory.findById(iterator.next().value);
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

  async createChannelWithNormalChats(chatNum: number): Promise<ChannelModel> {
    const channel: ChannelModel = await this.createBasicChannel('channel', 10);

    for (let i = 0; i < chatNum; i++) {
      const user: UserModel = this.userFactory.findById(
        channel.users.values().next().value,
      );
      await this.messageRepository.save({
        user: { id: user.id },
        channel: { id: channel.id },
        content: 'chat ' + i,
        time: new Date(),
        type: CHAT_MESSAGE,
      });
    }
    return this.channelFactory.findById(channel.id);
  }

  async createChannelWithSystemChats(chatNum: number): Promise<ChannelModel> {
    const channel: ChannelModel = await this.createBasicChannel('channel', 10);

    for (let i = 0; i < chatNum; i++) {
      const user: UserModel = this.userFactory.findById(
        channel.users.values().next().value,
      );
      let type: ChannelActionType;
      switch (i % 3) {
        case 0:
          type = CHAT_JOIN;
          break;
        case 1:
          type = CHAT_LEAVE;
          break;
        case 2:
          type = CHAT_MUTE;
          break;
        default:
          type = CHAT_MESSAGE;
      }

      await this.messageRepository.save({
        user: { id: user.id },
        channel: { id: channel.id },
        content: 'chat ' + i,
        time: new Date(),
        type: type,
      });
    }
    return this.channelFactory.findById(channel.id);
  }

  async giveTokenToUser(user: UserModel) {
    const token = this.jwtService.sign({
      id: user.id,
      nickname: user.nickname,
    });
    return token;
  }
}
