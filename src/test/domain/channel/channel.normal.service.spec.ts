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
import { ChannelMessagesHistoryDto } from '../../../domain/channel/dto/channel-message.dto';
import { GetChannelPageDto } from '../../../domain/channel/dto/get/get.channel.page.dto';
import { ChannelPageDtos } from '../../../domain/channel/dto/channel.page.dto';
import { GetChannelParticipantsDto } from '../../../domain/channel/dto/get/get.channel-participants.dto';
import { ChannelParticipantsDto } from '../../../domain/channel/dto/channel-participant.dto';
import { PostChannelDto } from '../../../domain/channel/dto/post/post.channel.dto';
import { PostChannelJoinDto } from '../../../domain/channel/dto/post/post.channel.join.dto';
import { DeleteChannelUserDto } from '../../../domain/channel/dto/delete/delete.channel.user.dto';
import { ChannelModule } from '../../../domain/channel/channel.module';
import { UserTestData } from 'src/test/data/user.test.data';
import { TestDataModule } from 'src/test/data/test.data.module';
import { User } from 'src/domain/user/user.entity';
import {
  CHANNEL_PARTICIPANT_NORMAL,
  CHANNEL_PARTICIPANT_OWNER,
} from 'src/domain/channel/type/type.channel-participant';
import * as bcrypt from 'bcrypt';

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
    /**
     * 채팅방 목록 조회
     * 채팅방 목록은 최신순, 인기순으로 조회할 수 있다.
     * 채팅방 목록은 검색이 가능하다.
     * 인기순으로 조회할 경우, 채팅방의 인원수가 많은 순으로 조회한다.
     * 최신순으로 조회할 경우, 최근에 만들어진 채팅방 순으로 조회한다.
     * 검색어가 있을 경우, 채팅방의 제목에서 검색어를 포함하는 채팅방만 조회한다.
     */
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

    /**
     * 채팅방 참여자 목록 조회
     * 나의 정보를 포함한 채팅방 참여자 목록을 조회한다.
     * 채팅방에 참여하지 않은 경우, 채팅방 참여자 목록을 조회할 수 없다.
     */
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
        const user: User = await userData.createUser('user');
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

    /**
     * 채팅방 생성
     * public 채팅방은 비밀번호가 없어야 한다.
     * 비밀번호가 있으면 비밀번호가 있는 protected채팅방이다.
     * private 채팅방은 비밀번호가 없다.
     * 이름이 같은 채팅방이 있으면 생성할 수 없다.
     * 채팅방 생성시 채팅방에 참여한다.
     * 채팅방 생성시 채팅방에 참여한 유저는 owner이다.
     * 이미 참여한 채팅방이 있으면 기존 채팅방에서 나간다.
     */
    describe('채팅방 생성', () => {
      it('[Valid Case] 채팅방 생성(public)', async () => {
        const user: User = await userData.createUser('user');
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PUBLIC,
          password: null,
          maxCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel[] = await channelRepository.find({
          where: { operator: { id: user.id }, isDeleted: false },
        });

        expect(savedChannelDb.length).toBe(1);
        expect(savedChannelDb[0].operator.id).toBe(user.id);
        expect(savedChannelDb[0].name).toBe(postChannelRequest.title);
        expect(savedChannelDb[0].type).toBe(postChannelRequest.access);
        expect(savedChannelDb[0].name).toBe(postChannelRequest.title);
        expect(savedChannelDb[0].password).toBe(null);
        expect(savedChannelDb[0].maxHeadCount).toBe(
          postChannelRequest.maxCount,
        );

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: { user: { id: user.id }, isDeleted: false },
          });
        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_OWNER);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          savedChannelDb[0].id,
        );

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(postChannelRequest.maxCount);
      });

      it('[Valid Case] 채팅방 생성(protected)', async () => {
        const user: User = await userData.createUser('user');
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PROTECTED,
          password: 'null',
          maxCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel[] = await channelRepository.find({
          where: { operator: { id: user.id }, isDeleted: false },
        });

        expect(savedChannelDb.length).toBe(1);
        expect(savedChannelDb[0].operator.id).toBe(user.id);
        expect(savedChannelDb[0].name).toBe(postChannelRequest.title);
        expect(savedChannelDb[0].type).toBe(postChannelRequest.access);
        expect(savedChannelDb[0].name).toBe(postChannelRequest.title);
        expect(
          await bcrypt.compare(
            postChannelRequest.password,
            savedChannelDb[0].password,
          ),
        ).toBe(true);
        expect(savedChannelDb[0].maxHeadCount).toBe(
          postChannelRequest.maxCount,
        );

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: { user: { id: user.id }, isDeleted: false },
          });
        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_OWNER);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          savedChannelDb[0].id,
        );

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(
          await bcrypt.compare(
            postChannelRequest.password,
            savedChannelFt.password,
          ),
        ).toBe(true);
        expect(savedChannelFt.maxHeadCount).toBe(postChannelRequest.maxCount);
      });

      it('[Valid Case] 채팅방 생성(private)', async () => {
        const user: User = await userData.createUser('user');
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PRIVATE,
          password: 'null',
          maxCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel[] = await channelRepository.find({
          where: { operator: { id: user.id }, isDeleted: false },
        });

        expect(savedChannelDb.length).toBe(1);
        expect(savedChannelDb[0].operator.id).toBe(user.id);
        expect(savedChannelDb[0].name).toBe(postChannelRequest.title);
        expect(savedChannelDb[0].type).toBe(postChannelRequest.access);
        expect(savedChannelDb[0].name).toBe(postChannelRequest.title);
        expect(savedChannelDb[0].password).toBe(null);
        expect(savedChannelDb[0].maxHeadCount).toBe(
          postChannelRequest.maxCount,
        );

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: { user: { id: user.id }, isDeleted: false },
          });
        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_OWNER);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          savedChannelDb[0].id,
        );

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(postChannelRequest.maxCount);
      });

      it('[Valid Case] 이미 채팅방에 참여중인 채팅방이 있는 경우', async () => {
        const user: UserModel = await channelData.createUserInChannel(9);
        const pastChannel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'newChannel',
          access: CHANNEL_PRIVATE,
          password: 'null',
          maxCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel[] = await channelRepository.find({
          where: { operator: { id: user.id }, isDeleted: false },
        });

        expect(savedChannelDb.length).toBe(1);
        expect(savedChannelDb[0].operator.id).toBe(user.id);
        expect(savedChannelDb[0].name).toBe(postChannelRequest.title);
        expect(savedChannelDb[0].type).toBe(postChannelRequest.access);
        expect(savedChannelDb[0].name).toBe(postChannelRequest.title);
        expect(savedChannelDb[0].password).toBe(null);
        expect(savedChannelDb[0].maxHeadCount).toBe(
          postChannelRequest.maxCount,
        );

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: { user: { id: user.id }, isDeleted: false },
          });
        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_OWNER);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          savedChannelDb[0].id,
        );

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.title);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(postChannelRequest.maxCount);

        const pastChannelFt: ChannelModel = channelFactory.findById(
          pastChannel.id,
        );
        expect(pastChannelFt.users.size).toBe(8);
        expect(pastChannelFt.users.has(user.id)).toBe(false);
      });

      it('[Error Case] 채팅방 생성 - 이름이 중복된 경우', async () => {
        const user: User = await userData.createUser('user');
        const user2: User = await userData.createUser('user2');
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

        const savedChannelDb: Channel[] = await channelRepository.find({
          where: { operator: { id: user2.id }, isDeleted: false },
        });
        expect(savedChannelDb.length).toBe(0);

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: { user: { id: user2.id }, isDeleted: false },
          });
        expect(savedChannelUserDb.length).toBe(0);
      });
    });

    /**
     * 채팅방 입장
     * public 채팅방에는 아무렇게나 입장할 수 있다.
     * private 채팅방에는 비밀번호를 입력해야 입장할 수 있다.
     * protected 채팅방에는 일반 입장으로는 입장할 수 없다. (초대가 있어야 함)
     * UserModel의 joinedChannel에 채팅방의 id가 추가된다.
     * 채팅방에 유저가 추가되면, 채팅방의 유저 수가 1 증가한다.
     * 채팅방에 유저가 추가되면, 채팅방의 유저 목록에 유저가 추가된다.
     * 이미 채팅방에 참여중인 유저가 다른 채팅방에 입장하면, 기존 채팅방에서는 나간다.
     * ban된 유저는 채팅방에 입장할 수 없다.
     */
    describe('채팅방 입장', () => {
      it('[Valid Case] public 채팅방 입장', async () => {
        const user: User = await userData.createUser('user');
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

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_NORMAL);
        expect(savedChannelUserDb[0].channel.headCount).toBe(6);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          basicChannel.name,
        );

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedChannelFt.users.size).toBe(6);
        expect(savedUserFt.joinedChannel).toBe(savedChannelFt.id);
      });

      it('[Valid Case] protected 채팅방 입장', async () => {
        const user: User = await userData.createUser('user');
        const basicChannel: ChannelModel =
          await channelData.createProtectedChannel('protected', 6);
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: 'password',
        };

        await service.postChannelJoin(joinChannelRequest);

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_NORMAL);
        expect(savedChannelUserDb[0].channel.headCount).toBe(7);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          basicChannel.name,
        );

        expect(savedChannelFt.users.size).toBe(7);
      });

      it('[Valid Case] 초대가 와있는데 초대 수락 안하고 입장해버린 경우', async () => {
        const user: UserModel = await channelData.createInvitePendingUser(10);
        const basicChannel: ChannelModel =
          await channelData.createProtectedChannel('protected', 6);
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: 'password',
        };

        await service.postChannelJoin(joinChannelRequest);
        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_NORMAL);
        expect(savedChannelUserDb[0].channel.headCount).toBe(7);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          basicChannel.name,
        );

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedChannelFt.users.size).toBe(7);
        expect(savedUserFt.channelInviteList.size).toBe(
          user.channelInviteList.size,
        );
      });

      it('[Valid Case] 소속된 채팅방이 있는 상태로 다른 채팅방에 입장한 경우', async () => {
        const user: UserModel = await channelData.createUserInChannel(9);
        const pastChannel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'otherChannel',
          5,
        );
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          channelId: basicChannel.id,
          password: null,
        };

        await service.postChannelJoin(joinChannelRequest);

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: {
              user: { id: user.id },
              channel: { id: basicChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_NORMAL);
        expect(savedChannelUserDb[0].channel.headCount).toBe(6);

        const savedChannelFt: ChannelModel = channelFactory.findByChannelName(
          basicChannel.name,
        );

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedChannelFt.users.size).toBe(6);
        expect(savedUserFt.joinedChannel).toBe(savedChannelFt.id);

        const pastChannelFt: ChannelModel = channelFactory.findById(
          pastChannel.id,
        );

        expect(pastChannelFt.users.size).toBe(8);
        expect(pastChannelFt.users.has(user.id)).toBe(false);
      });

      it('[Error Case] protected 채팅방 입장시 비밀번호가 잘못된 경우', async () => {
        const user: User = await userData.createUser('user');
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
        const user: User = await userData.createUser('user');
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
        const user: User = await userData.createUser('user');
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

    /**
     * 채팅 전송
     * 채팅이 전송되면 채팅 메시지가 저장되어야 한다.
     */
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
            order: { id: 'DESC' },
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

    /**
     * 채팅방에서 퇴장하면 채팅방의 인원수가 줄어든다.
     * 채팅방의 인원수가 0이 되면 채팅방이 삭제된다.
     * owner가 퇴장하면 채팅방의 owner가 없어진다
     * 채팅방의 owner가 없어져도 채팅방은 존재한다
     * 다시 owner가 들어와도 채팅방의 owner가 되지 않는다
     * admin이 퇴장하면 adminList에서 제거된다
     * 다시 입장하면 adminList에 추가되지 않는다
     * 채널에서는 mute된 유저가 퇴장해도 mute가 풀리지 않는다.
     * 유저의 isMuted는 채널에서 mute된 경우에만 true이다.
     */
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

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedUserFt.joinedChannel).toBe(null);
      });

      it('[Valid Case] owner가 퇴장하는 경우', async () => {
        const channel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          5,
        );
        const user: UserModel = userFactory.findById(channel.ownerId);

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
        expect(channelUserDb.channel.headCount).toBe(4);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(false);
        expect(savedChannelFt.ownerId).toBe(null);

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedUserFt.joinedChannel).toBe(null);
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

        const savedUserFt: UserModel = userFactory.findById(admin.id);

        expect(savedUserFt.joinedChannel).toBe(null);
      });

      it('[Valid Case] mute 된 유저가 퇴장하는 경우', async () => {
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

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedUserFt.joinedChannel).toBe(null);
        expect(savedUserFt.isMuted).toBe(false);
      });

      it('[Valid Case] 모든 유저가 퇴장하는 경우', async () => {
        const channel: ChannelModel = await channelData.createBasicChannel(
          'channels',
          1,
        );
        const user: UserModel = userFactory.findById(channel.ownerId);

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: user.id,
          channelId: channel.id,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);

        const channelUserDb: ChannelUser[] = await channelUserRepository.find({
          where: {
            user: { id: user.id },
            channel: { id: channel.id },
            isDeleted: false,
          },
        });

        expect(channelUserDb.length).toBe(0);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );
        expect(savedChannelFt).toBe(undefined);
        const savedUserFt: UserModel = userFactory.findById(user.id);
        expect(savedUserFt.joinedChannel).toBe(null);
      });
    });
  });

  /**
   * 채팅방의 채팅 내역을 조회한다.
   * 채팅방에 입장한 유저만 채팅 내역을 조회할 수 있다.
   * 채팅 내역은 최신순으로 정렬되어야 한다.
   * 채팅 내역은 count로 받은 개수만큼 조회할 수 있다.
   * 채팅 내역은 offset으로 받은 number 이전의 id만 조회할 수 있다.
   * 마지막 페이지인 경우 isLastPage는 true이다.
   */
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
      const user: User = await userData.createUser('user');

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
