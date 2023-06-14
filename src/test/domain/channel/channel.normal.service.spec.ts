import { Test, TestingModule } from '@nestjs/testing';
import { ChannelNormalService } from '../../../domain/channel/service/channel.normal.service';
import { ChannelModel } from '../../../domain/factory/model/channel.model';
import { UserModel } from '../../../domain/factory/model/user.model';
import {
  CHANNEL_PRIVATE,
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
} from 'src/domain/channel/type/type.channel';
import { Channel } from '../../../domain/channel/entity/channel.entity';
import { BadRequestException } from '@nestjs/common';
import { ChannelFactory } from '../../../domain/factory/channel.factory';
import { UserFactory } from '../../../domain/factory/user.factory';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { InviteModel } from '../../../domain/factory/model/invite.model';
import { ChannelTestData as ChannelData } from '../../data/channel.test.data';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { GatewayModule } from 'src/gateway/gateway.module';
import { FactoryModule } from '../../../domain/factory/factory.module';
import {
  ORDER_CHANNEL_POPULAR,
  ORDER_CHANNEL_RESENT,
} from 'src/domain/channel/type/type.order.channel';
import { PostChannelMessageDto } from '../../../domain/channel/dto/post/post.channel-message.dto';
import { CHAT_MESSAGE } from 'src/domain/channel/type/type.channel.action';
import { ChannelMessage } from '../../../domain/channel/entity/channel-message.entity';
import {
  CHATTYPE_ME,
  CHATTYPE_OTHERS,
  CHATTYPE_SYSTEM,
} from 'src/global/type/type.chat';
import { ChannelUser } from '../../../domain/channel/entity/channel-user.entity';
import { PostChannelAcceptInviteDto } from '../../../domain/channel/dto/post/post.channel.accept.invite.dto';
import { ChannelMessagesHistoryDto } from '../../../domain/channel/dto/channel-message.history.dto';
import { GetChannelPageDto } from '../../../domain/channel/dto/get/get.channel.page.dto';
import { ChannelPageDtos } from '../../../domain/channel/dto/channel.page.dto';
import { GetChannelParticipantsDto } from '../../../domain/channel/dto/get/get.channel-participants.dto';
import { ChannelParticipantsDto } from '../../../domain/channel/dto/channel-participant.dto';
import { PostChannelDto } from '../../../domain/channel/dto/post/post.channel.dto';
import { PostChannelJoinDto } from '../../../domain/channel/dto/post/post.channel.join.dto';
import { PostInviteDto } from '../../../domain/channel/dto/post/post.invite.dto';
import { DeleteChannelInviteDto } from '../../../domain/channel/dto/delete/delete.channel.invite.dto';
import { DeleteChannelUserDto } from '../../../domain/channel/dto/delete/delete.channel.user.dto';
import { ChannelModule } from '../../../domain/channel/channel.module';
import { UserTestData } from 'src/test/data/user.test.data';
import { TestDataModule } from 'src/test/data/test.data.module';
import { User } from 'src/domain/user/user.entity';

describe('ChannelUserService', () => {
  let service: ChannelNormalService;
  let channelFactory: ChannelFactory;
  let userFactory: UserFactory;
  let userData: UserTestData;
  let channelData: ChannelData;
  let dataSource: DataSource;
  let channelRepository: Repository<Channel>;
  let channelUserRepository: Repository<ChannelUser>;
  let channelMessageRepository: Repository<ChannelMessage>;

  initializeTransactionalContext();
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestDataModule,
        FactoryModule,
        GatewayModule,
        TypeOrmModule.forRootAsync({
          useFactory() {
            return typeORMConfig;
          },
          async dataSourceFactory(options) {
            if (!options) {
              throw new Error('Invalid options passed');
            }
            return addTransactionalDataSource({
              dataSource: new DataSource(options),
            });
          },
        }),
        ChannelModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(Channel),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ChannelUser),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ChannelMessage),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ChannelNormalService>(ChannelNormalService);
    userData = module.get<UserTestData>(UserTestData);
    channelData = module.get<ChannelData>(ChannelData);
    channelFactory = module.get<ChannelFactory>(ChannelFactory);
    userFactory = module.get<UserFactory>(UserFactory);
    dataSource = module.get<DataSource>(DataSource);
    channelRepository = module.get<Repository<Channel>>(
      getRepositoryToken(Channel),
    );
    channelUserRepository = module.get<Repository<ChannelUser>>(
      getRepositoryToken(ChannelUser),
    );
    channelMessageRepository = module.get<Repository<ChannelMessage>>(
      getRepositoryToken(ChannelMessage),
    );
    await dataSource.synchronize(true);
  });

  afterEach(async () => {
    userData.clear();
    userFactory.users.clear();
    channelFactory.channels.clear();
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('일반 유저 기능', () => {
    describe('채팅방 목록 조회', () => {
      it('[Valid Case] 채팅방 목록 조회(resent)', async () => {
        await channelData.createBasicChannels(10);

        const getResentPageDto: GetChannelPageDto = {
          page: 1,
          count: 10,
          orderBy: ORDER_CHANNEL_RESENT,
          keyword: null,
        };

        const channelList: ChannelPageDtos = await service.getChannelPages(
          getResentPageDto,
        );
        expect(channelList.channels[0]).toHaveProperty('id');
        expect(channelList.channels[0]).toHaveProperty('title');
        expect(channelList.channels[0]).toHaveProperty('access');
        expect(channelList.channels[0]).toHaveProperty('headCount');
        expect(channelList.channels[0]).toHaveProperty('maxCount');
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
      });

      it('[Valid Case] 채팅방 목록 조회(popular)', async () => {
        await channelData.createBasicChannels(10);

        const getPopularPageDto: GetChannelPageDto = {
          page: 1,
          count: 10,
          orderBy: ORDER_CHANNEL_POPULAR,
          keyword: null,
        };
        const channelList: ChannelPageDtos = await service.getChannelPages(
          getPopularPageDto,
        );
        expect(channelList.channels[0]).toHaveProperty('id');
        expect(channelList.channels[0]).toHaveProperty('title');
        expect(channelList.channels[0]).toHaveProperty('access');
        expect(channelList.channels[0]).toHaveProperty('headCount');
        expect(channelList.channels[0]).toHaveProperty('maxCount');
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(channelList.channels[0].headCount).toBeGreaterThanOrEqual(
          channelList.channels[1].headCount,
        );
        expect(channelList.channels[1].headCount).toBeGreaterThanOrEqual(
          channelList.channels[2].headCount,
        );
      });

      it('[Valid Case] 채팅방 목록 조회(empty page)', async () => {
        const getEmptyPageDto: GetChannelPageDto = {
          page: 1,
          count: 10,
          orderBy: ORDER_CHANNEL_RESENT,
          keyword: null,
        };

        const channelList: ChannelPageDtos = await service.getChannelPages(
          getEmptyPageDto,
        );
        expect(channelList.channels.length).toBe(0);
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(channelList.currentPage).toBe(1);
        expect(channelList.totalPage).toBe(1);
      });

      it('[Valid Case] 채팅방 목록 조회(keyword에 해당하는거 있음)', async () => {
        await channelData.createBasicChannels(10);

        const getKeywordMatchPageDto: GetChannelPageDto = {
          page: 1,
          count: 10,
          orderBy: ORDER_CHANNEL_RESENT,
          keyword: 'name',
        };

        const channelList: ChannelPageDtos = await service.getChannelPages(
          getKeywordMatchPageDto,
        );
        expect(channelList.channels[0]).toHaveProperty('id');
        expect(channelList.channels[0]).toHaveProperty('title');
        expect(channelList.channels[0]).toHaveProperty('access');
        expect(channelList.channels[0]).toHaveProperty('headCount');
        expect(channelList.channels[0]).toHaveProperty('maxCount');
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(
          channelList.channels[0].title.indexOf(getKeywordMatchPageDto.keyword),
        ).not.toBe(1);
        expect(
          channelList.channels[1].title.indexOf(getKeywordMatchPageDto.keyword),
        ).not.toBe(1);
      });
      it('[Valid Case] 채팅방 목록 조회(keyword에 해당하는거 없음)', async () => {
        const getKeywordUnmatchPageDto: GetChannelPageDto = {
          page: 1,
          count: 10,
          orderBy: ORDER_CHANNEL_RESENT,
          keyword: 'noooooooooooooo',
        };

        const channelList: ChannelPageDtos = await service.getChannelPages(
          getKeywordUnmatchPageDto,
        );
        expect(channelList.channels.length).toBe(0);
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(channelList.currentPage).toBe(1);
        expect(channelList.totalPage).toBe(1);
      });
    });

    describe('채팅방 참여자 목록 조회', () => {
      it('[Valid Case] 채팅방 참여자 목록 조회 (기본)', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'name',
          10,
        );
        const user: UserModel = userFactory.findById(
          basicChannel.users.values().next().value,
        );
        const getChannelParticipantsRequest: GetChannelParticipantsDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        const participants: ChannelParticipantsDto =
          await service.getChannelParticipants(getChannelParticipantsRequest);

        expect(participants).toHaveProperty('me');
        expect(participants.me).toHaveProperty('nickname');
        expect(participants.me).toHaveProperty('imgUrl');
        expect(participants.me).toHaveProperty('roleType');
        expect(participants.me).toHaveProperty('isMuted');
        expect(participants).toHaveProperty('participants');
        expect(participants.participants[0]).toHaveProperty('nickname');
        expect(participants.participants[0]).toHaveProperty('imgUrl');
        expect(participants.participants[0]).toHaveProperty('roleType');
        expect(participants.participants[0]).toHaveProperty('isMuted');
        expect(participants).toHaveProperty('headCount');
        expect(participants).toHaveProperty('maxCount');
      });
      it('[Valid Case] 채팅방 참여자 목록 조회 (심화)', async () => {
        const channel: ChannelModel = await channelData.createChannelWithAdmins(
          9,
        );
        const user: UserModel = userFactory.findById(
          channel.users.values().next().value,
        );
        const getChannelParticipantsRequest: GetChannelParticipantsDto = {
          userId: user.id,
          channelId: channel.id,
        };

        const participants: ChannelParticipantsDto =
          await service.getChannelParticipants(getChannelParticipantsRequest);

        expect(participants).toHaveProperty('me');
        expect(participants.me).toHaveProperty('nickname');
        expect(participants.me).toHaveProperty('imgUrl');
        expect(participants.me).toHaveProperty('roleType');
        expect(participants.me).toHaveProperty('isMuted');
        expect(participants).toHaveProperty('participants');
        expect(participants.me.nickname).toBe(user.nickname);
        expect(participants.me.imgUrl).toBe(user.profileImage);
        expect(participants.participants[0].roleType).toBe('admin');
        expect(participants.participants[0].isMuted).toBe(false);
        expect(participants).toHaveProperty('headCount');
        expect(participants).toHaveProperty('maxCount');
      });
      it('[Error Case] 채팅방에 없는 유저의 조회 요청', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          10,
        );
        const user: User = await userData.createBasicUser('user');
        const getChannelParticipantsRequest: GetChannelParticipantsDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await expect(() =>
          service.getChannelParticipants(getChannelParticipantsRequest),
        ).rejects.toThrow(
          new BadRequestException('You are not in this channel'),
        );
      });
    });

    describe('채팅방 생성', () => {
      it('[Valid Case] 채팅방 생성(public)', async () => {
        const user: User = await userData.createBasicUser('user');
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PUBLIC,
          password: null,
          maxCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { operator: { id: user.id } },
        });

        expect(savedChannelDb.operator.id).toBe(user.id);
        expect(savedChannelDb.name).toBe(postChannelRequest.title);
        expect(savedChannelDb.type).toBe(postChannelRequest.access);
        expect(savedChannelDb.name).toBe(postChannelRequest.title);
        expect(savedChannelDb.password).toBe(null);
        expect(savedChannelDb.maxHeadCount).toBe(postChannelRequest.maxCount);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          savedChannelDb.name,
        );

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(postChannelRequest.maxCount);
      });

      it('[Valid Case] 채팅방 생성(protected)', async () => {
        const user: User = await userData.createBasicUser('user');
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PROTECTED,
          password: 'null',
          maxCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { operator: { id: user.id } },
        });

        expect(savedChannelDb.operator.id).toBe(user.id);
        expect(savedChannelDb.name).toBe(postChannelRequest.title);
        expect(savedChannelDb.type).toBe(postChannelRequest.access);
        expect(savedChannelDb.name).toBe(postChannelRequest.title);
        expect(savedChannelDb.password).toBe(postChannelRequest.password);
        expect(savedChannelDb.maxHeadCount).toBe(postChannelRequest.maxCount);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          savedChannelDb.name,
        );

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.password).toBe(postChannelRequest.password);
        expect(savedChannelFt.maxHeadCount).toBe(postChannelRequest.maxCount);
      });

      it('[Valid Case] 채팅방 생성(private)', async () => {
        const user: User = await userData.createBasicUser('user');
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PRIVATE,
          password: 'null',
          maxCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { operator: { id: user.id } },
        });

        expect(savedChannelDb.operator.id).toBe(user.id);
        expect(savedChannelDb.name).toBe(postChannelRequest.title);
        expect(savedChannelDb.type).toBe(postChannelRequest.access);
        expect(savedChannelDb.name).toBe(postChannelRequest.title);
        expect(savedChannelDb.password).toBe(null);
        expect(savedChannelDb.maxHeadCount).toBe(postChannelRequest.maxCount);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          savedChannelDb.name,
        );

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(postChannelRequest.maxCount);
      });

      it('[Error Case] 채팅방 생성 - 이름이 중복된 경우', async () => {
        const user: User = await userData.createBasicUser('user');
        const user2: User = await userData.createBasicUser('user2');
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PUBLIC,
          password: null,
          maxCount: 10,
        };
        const duplicatedRequest: PostChannelDto = {
          userId: user2.id,
          title: 'channel',
          access: CHANNEL_PUBLIC,
          password: null,
          maxCount: 10,
        };

        await service.postChannel(postChannelRequest);

        await expect(service.postChannel(duplicatedRequest)).rejects.toThrow(
          new BadRequestException('Channel name already exists'),
        );

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          duplicatedRequest.title,
        );

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(postChannelRequest.maxCount);
      });
    });

    describe('채팅방 입장', () => {
      it('[Valid Case] public 채팅방 입장', async () => {
        const user: User = await userData.createBasicUser('user');
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          5,
        );
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: null,
        };

        await service.postChannelJoin(joinChannelRequest);

        const savedChannelUserDb: ChannelUser =
          await channelUserRepository.findOne({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.user.id).toBe(user.id);
        expect(savedChannelUserDb.channel.headCount).toBe(6);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          basicChannel.name,
        );

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedChannelFt.users.size).toBe(6);
        expect(savedUserFt.joinedChannel).toBe(savedChannelFt.id);
      });

      it('[Valid Case] protected 채팅방 입장', async () => {
        const user: User = await userData.createBasicUser('user');
        const basicChannel: ChannelModel =
          await channelData.createProtectedChannel('protected', 6);
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: 'password',
        };

        await service.postChannelJoin(joinChannelRequest);

        const savedChannelUserDb: ChannelUser =
          await channelUserRepository.findOne({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.user.id).toBe(user.id);
        expect(savedChannelUserDb.channel.headCount).toBe(7);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          basicChannel.name,
        );

        expect(savedChannelFt.users.size).toBe(7);
      });

      it('[Valid Case] 초대가 와있는데 초대 수락 안하고 입장해버린 경우', async () => {
        const user: UserModel = await channelData.createInvitePendingUser();
        const basicChannel: ChannelModel =
          await channelData.createProtectedChannel('protected', 6);
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: 'password',
        };

        await service.postChannelJoin(joinChannelRequest);
        const savedChannelUserDb: ChannelUser =
          await channelUserRepository.findOne({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.user.id).toBe(user.id);
        expect(savedChannelUserDb.channel.headCount).toBe(7);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          basicChannel.name,
        );

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedChannelFt.users.size).toBe(7);
        expect(savedUserFt.inviteList.size).toBe(user.inviteList.size);
      });

      it('[Error Case] protected 채팅방 입장시 비밀번호가 잘못된 경우', async () => {
        const user: User = await userData.createBasicUser('user');
        const basicChannel: ChannelModel =
          await channelData.createProtectedChannel('protected', 6);
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: 'wrongPassword',
        };

        await expect(
          service.postChannelJoin(joinChannelRequest),
        ).rejects.toThrow(new BadRequestException('Password is wrong'));
      });

      it('[Error Case] private 채팅방 입장', async () => {
        const user: User = await userData.createBasicUser('user');
        const basicChannel: ChannelModel =
          await channelData.createPrivateChannel('private', 6);
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: null,
        };

        await expect(() =>
          service.postChannelJoin(joinChannelRequest),
        ).rejects.toThrow(new BadRequestException('Channel is private'));
      });

      it('[Error Case] Ban되어 있는 경우', async () => {
        const user: User = await userData.createBasicUser('user');
        const basicChannel: ChannelModel =
          await channelData.createBannedChannel(user.id);
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: null,
        };

        await expect(() =>
          service.postChannelJoin(joinChannelRequest),
        ).rejects.toThrow(new BadRequestException('You are banned'));
      });
    });

    describe('채팅방 초대', () => {
      it('[Valid Case] 일반 유저 초대', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'chanel',
          5,
        );
        const user: User = await userData.createBasicUser('user');

        const inviteRequest: PostInviteDto = {
          userId: basicChannel.ownerId,
          channelId: basicChannel.id,
          targetId: user.id,
        };

        service.postInvite(inviteRequest);

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedUserFt.inviteList.size).toBe(1);
      });
      it('[Valid Case] public 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          6,
        );
        const user: User = await userData.createBasicUser('user');
        const invite: InviteModel = new InviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );

        userFactory.invite(user.id, invite);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);

        const savedChannelUserDb: ChannelUser =
          await channelUserRepository.findOne({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.user.id).toBe(user.id);
        const savedUserFt: UserModel = userFactory.findById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });
      it('[Valid Case] private 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel =
          await channelData.createPrivateChannel('channel', 5);
        const user: User = await userData.createBasicUser('user');
        const invite: InviteModel = new InviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.invite(user.id, invite);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);
        const savedChannelUserDb: ChannelUser =
          await channelUserRepository.findOne({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.user.id).toBe(user.id);
        const savedUserFt: UserModel = userFactory.findById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });
      it('[Valid Case] protected 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel =
          await channelData.createProtectedChannel('channel', 6);
        const user: User = await userData.createBasicUser('user');
        const invite: InviteModel = new InviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.invite(user.id, invite);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);
        const savedChannelUserDb: ChannelUser =
          await channelUserRepository.findOne({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.user.id).toBe(user.id);
        const savedUserFt: UserModel = userFactory.findById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });
      it('[Valid Case] 채팅방 초대 거절', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          6,
        );
        const user: User = await userData.createBasicUser('user');
        const invite: InviteModel = new InviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.invite(user.id, invite);

        const deleteInviteRequest: DeleteChannelInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await service.deleteChannelInvite(deleteInviteRequest);
        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedUserFt.inviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
      });
      it('[Error Case] BAN 목록에 있는 유저가 초대 수락한 경우', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          6,
        );
        const user: User = await userData.createBasicUser('user');
        basicChannel.banList.set(user.id, user.id);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await expect(
          service.postChannelAcceptInvite(InviteAcceptRequest),
        ).rejects.toThrow(new BadRequestException('You are not invited'));
        const savedUserFt: UserModel = userFactory.findById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
        expect(savedChannelFt.users.has(user.id)).toBe(false);
      });
      it('[Error Case] 수락했는데 채팅방이 꽉 찬 경우', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          10,
        );
        const user: User = await userData.createBasicUser('user');
        const invite: InviteModel = new InviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.invite(user.id, invite);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await expect(
          service.postChannelAcceptInvite(InviteAcceptRequest),
        ).rejects.toThrow(new BadRequestException('Channel is full'));

        const savedUserFt: UserModel = userFactory.findById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
        expect(savedChannelFt.users.has(user.id)).toBe(false);
      });
    });

    describe('채팅 전송', () => {
      it('[Valid Case] 채팅 전송', async () => {
        const user: UserModel = await channelData.createUserInChannel(9);
        const postMessageRequest: PostChannelMessageDto = {
          userId: user.id,
          channelId: user.joinedChannel,
          type: CHAT_MESSAGE,
          content: 'hi',
        };

        await service.postChannelMessage(postMessageRequest);

        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              user: { id: user.id },
              channel: { id: user.joinedChannel },
              type: CHAT_MESSAGE,
            },
          });
        expect(savedMessage.content).toBe('hi');
      });
      it('[Error Case] 채팅 전송(Mute된 경우)', async () => {
        const user: UserModel = await channelData.createMutedUserInChannel(9);
        const postMessageRequest: PostChannelMessageDto = {
          userId: user.id,
          channelId: user.joinedChannel,
          type: CHAT_MESSAGE,
          content: 'hi',
        };

        await service.postChannelMessage(postMessageRequest);

        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              user: { id: user.id },
              channel: { id: user.joinedChannel },
              type: CHAT_MESSAGE,
            },
          });
        expect(savedMessage).toBe(null);
      });
    });

    describe('채팅방 퇴장', () => {
      it('[Valid Case] 일반 유저가 퇴장하는 경우', async () => {
        const user: UserModel = await channelData.createUserInChannel(9);
        const channel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: user.id,
          channelId: channel.id,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);

        const channelUserDb: ChannelUser = await channelUserRepository.findOne({
          where: {
            user: { id: user.id },
            channel: { id: channel.id },
          },
        });

        expect(channelUserDb.isDeleted).toBe(true);
        expect(channelUserDb.channel.headCount).toBe(8);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(false);
      });
      it('[Valid Case] owner가 퇴장하는 경우', async () => {
        const channel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          5,
        );

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: channel.ownerId,
          channelId: channel.id,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);
        const channelUserDb: ChannelUser = await channelUserRepository.findOne({
          where: {
            user: { id: channel.ownerId },
            channel: { id: channel.id },
          },
        });

        expect(channelUserDb.isDeleted).toBe(true);
        expect(channelUserDb.channel.headCount).toBe(4);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(channel.ownerId)).toBe(false);
        expect(savedChannelFt.ownerId).toBe(null);
      });

      it('[Valid Case] admin이 퇴장하는 경우', async () => {
        const channel: ChannelModel = await channelData.createChannelWithAdmins(
          9,
        );
        const admin: UserModel = userFactory.findById(
          channel.adminList.values().next().value,
        );

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: admin.id,
          channelId: channel.id,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);
        const channelUserDb: ChannelUser = await channelUserRepository.findOne({
          where: {
            user: { id: admin.id },
            channel: { id: channel.id },
          },
        });

        expect(channelUserDb.isDeleted).toBe(true);
        expect(channelUserDb.channel.headCount).toBe(8);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(admin.id)).toBe(false);
        expect(savedChannelFt.users.size).toBe(8);
      });
      it('[Valid Case] mute 된 유저가 퇴장하는 경우(mute 상태 유지)', async () => {
        const user: UserModel = await channelData.createMutedUserInChannel(9);
        const channel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: user.id,
          channelId: channel.id,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);
        const channelUserDb: ChannelUser = await channelUserRepository.findOne({
          where: {
            user: { id: user.id },
            channel: { id: channel.id },
          },
        });

        expect(channelUserDb.isDeleted).toBe(true);
        expect(channelUserDb.channel.headCount).toBe(8);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(false);
        expect(savedChannelFt.muteList.get(user.id)).toBe(user.id);
      });
    });
  });

  describe('채팅방 채팅 내역 조회', () => {
    it('[Valid Case] 일반 유저의 채팅 내역 조회 (last page 아닌 경우)', async () => {
      const channel: ChannelModel =
        await channelData.createChannelWithNormalChats(100);
      const user: UserModel = userFactory.findById(
        channel.users.values().next().value,
      );

      const getChannelMessageHistoryRequest = {
        userId: user.id,
        channelId: channel.id,
        offset: 2147483647,
        count: 10,
      };

      const channelChatList: ChannelMessagesHistoryDto =
        await service.getChannelMessageHistory(getChannelMessageHistoryRequest);

      expect(channelChatList.chats.length).toBe(10);
      for (const c of channelChatList.chats) {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('message');
        expect(c).toHaveProperty('nickname');
        expect(c).toHaveProperty('time');
        expect(c).toHaveProperty('type');
        if (c.type === CHATTYPE_ME) {
          expect(c.nickname).toBe(user.nickname);
        } else if (c.type === CHATTYPE_OTHERS) {
          expect(c.nickname).not.toBe(user.nickname);
        }
        expect(channelChatList.isLastPage).toBe(false);
      }
    });

    it('[Valid Case] 일반 유저의 채팅 내역 조회 (last page인 경우)', async () => {
      const channel: ChannelModel =
        await channelData.createChannelWithNormalChats(100);
      const user: UserModel = userFactory.findById(
        channel.users.values().next().value,
      );

      const getChannelMessageHistoryRequest = {
        userId: user.id,
        channelId: channel.id,
        offset: 11,
        count: 10,
      };

      const channelChatList: ChannelMessagesHistoryDto =
        await service.getChannelMessageHistory(getChannelMessageHistoryRequest);

      expect(channelChatList.chats.length).toBe(10);
      for (const c of channelChatList.chats) {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('message');
        expect(c).toHaveProperty('nickname');
        expect(c).toHaveProperty('time');
        expect(c).toHaveProperty('type');
        if (c.type === CHATTYPE_ME) {
          expect(c.nickname).toBe(user.nickname);
        } else if (c.type === CHATTYPE_OTHERS) {
          expect(c.nickname).not.toBe(user.nickname);
        }
      }
      expect(channelChatList.isLastPage).toBe(true);
    });

    it('[Valid Case] 일반 유저의 채팅 내역 조회 (system message 포함)', async () => {
      const channel: ChannelModel =
        await channelData.createChannelWithSystemChats(100);
      const user: UserModel = userFactory.findById(
        channel.users.values().next().value,
      );

      const getChannelMessageHistoryRequest = {
        userId: user.id,
        channelId: channel.id,
        offset: 2147483647,
        count: 10,
      };

      const channelChatList: ChannelMessagesHistoryDto =
        await service.getChannelMessageHistory(getChannelMessageHistoryRequest);

      expect(channelChatList.chats.length).toBe(10);
      for (const c of channelChatList.chats) {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('message');
        expect(c).toHaveProperty('nickname');
        expect(c).toHaveProperty('time');
        expect(c).toHaveProperty('type');
        if (c.type === CHATTYPE_ME) {
          expect(c.nickname).toBe(user.nickname);
        } else if (c.type === CHATTYPE_OTHERS) {
          expect(c.nickname).not.toBe(user.nickname);
        } else {
          expect(c.type).toBe(CHATTYPE_SYSTEM);
        }
      }
    });

    it('[Error Case] 채팅방에 없는 유저가 조회 요청을 보낸 경우', async () => {
      const channel: ChannelModel =
        await channelData.createChannelWithNormalChats(100);
      const user: User = await userData.createBasicUser('user');

      const getChannelMessageHistoryRequest = {
        userId: user.id,
        channelId: channel.id,
        offset: 2147483647,
        count: 10,
      };

      await expect(
        service.getChannelMessageHistory(getChannelMessageHistoryRequest),
      ).rejects.toThrow(new BadRequestException('You are not in this channel'));
    });
  });
});
