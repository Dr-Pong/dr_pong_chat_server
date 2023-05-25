import { Test, TestingModule } from '@nestjs/testing';
import { UserChannelService } from './user-channel.service';
import { ChannelModel } from '../channel/channel.model';
import { UserModel } from '../user/user.model';
import {
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
} from 'src/global/type/type.channel';
import { Channel } from '../channel/channel.entity';
import { BadRequestException } from '@nestjs/common';
import { ChannelFactory } from '../channel/channel.factory';
import { UserChannelModule } from './user-channel.module';
import { UserFactory } from '../user/user.factory';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UserChannelService', () => {
  let service: UserChannelService;
  let channelFactory: ChannelFactory;
  let userFactory: UserFactory;
  let channelRepository: Repository<Channel>;
  let testData: ChannelTestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UserChannelModule],
      providers: [
        {
          provide: getRepositoryToken(Channel),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserChannelService>(UserChannelService);
    channelFactory = module.get<ChannelFactory>(ChannelFactory);
    userFactory = module.get<UserFactory>(UserFactory);
    channelRepository = module.get<Repository<Channel>>(Repository);
  });

  describe('일반 유저 기능', () => {
    describe('채팅방 목록 조회', () => {
      it('[Valid Case] 채팅방 목록 조회(resent)', async () => {
        await testData.createBasicChannels();

        const getResentPageDto: GetChannelPageDtos = {
          page: 1,
          order: 'resent',
          keyword: null,
        };

        const channelList: ChannelPageDtos =
          service.getChannelPages(getResentPageDto);
        expect(channelList).toHaveProperty('[].id');
        expect(channelList).toHaveProperty('[].title');
        expect(channelList).toHaveProperty('[].access');
        expect(channelList).toHaveProperty('[].headcount');
        expect(channelList).toHaveProperty('[].maxcount');
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(channelList.channels[0].id).toBeGreaterThan(
          channelList.channels[1].id,
        );
        expect(channelList.channels[1].id).toBeGreaterThan(
          channelList.channels[2].id,
        );
      });

      it('[Valid Case] 채팅방 목록 조회(popular)', async () => {
        await testData.createBasicChannels();

        const getPopularPageDto: GetChannelPageDtos = {
          page: 1,
          order: 'popular',
          keyword: null,
        };
        const channelList: ChannelPageDtos =
          service.getChannelPages(getPopularPageDto);
        expect(channelList.channels).toHaveProperty('[].id');
        expect(channelList.channels).toHaveProperty('[].title');
        expect(channelList.channels).toHaveProperty('[].access');
        expect(channelList.channels).toHaveProperty('[].headcount');
        expect(channelList.channels).toHaveProperty('[].maxcount');
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(channelList.channels[0].headcount).toBeGreaterThanOrEqual(
          channelList.channels[1].headcount,
        );
        expect(channelList.channels[1].headcount).toBeGreaterThanOrEqual(
          channelList.channels[2].headcount,
        );
      });

      it('[Valid Case] 채팅방 목록 조회(empty page)', async () => {
        const getEmptyPageDto: GetChannelPageDtos = {
          page: 1,
          order: 'resent',
          keyword: null,
        };

        const channelList: ChannelPageDtos =
          service.getChannelPages(getEmptyPageDto);
        expect(channelList.channels).toBe('[]');
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(channelList.currentPage).toBe('currentPage');
        expect(channelList.totalPage).toBe('totalPage');
      });

      it('[Valid Case] 채팅방 목록 조회(keyword에 해당하는거 있음)', async () => {
        await testData.createBasicChannels();

        const getKeywordMatchPageDto: GetChannelPageDtos = {
          page: 1,
          order: 'resent',
          keyword: 'abcd',
        };

        const channelList: ChannelPageDtos = service.getChannelPages(
          getKeywordMatchPageDto,
        );
        expect(channelList.channels).toHaveProperty('[].id');
        expect(channelList.channels).toHaveProperty('[].title');
        expect(channelList.channels).toHaveProperty('[].access');
        expect(channelList.channels).toHaveProperty('[].headcount');
        expect(channelList.channels).toHaveProperty('[].maxcount');
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(channelList.channels[0].id).toBeGreaterThanOrEqual(
          channelList.channels[1].id,
        );
        expect(channelList.channels[1].id).toBeGreaterThanOrEqual(
          channelList.channels[2].id,
        );
        expect(
          channelList.channels[0].title.indexOf(getKeywordMatchPageDto.keyword),
        ).not.toBe(-1);
        expect(
          channelList.channels[1].title.indexOf(getKeywordMatchPageDto.keyword),
        ).not.toBe(-1);
      });
      it('[Valid Case] 채팅방 목록 조회(keyword에 해당하는거 없음)', async () => {
        const getKeywordUnmatchPageDto: GetChannelPageDtos = {
          page: 1,
          order: 'resent',
          keyword: 'noooooooooooooo',
        };

        const channelList: ChannelPageDtos = service.getChannelPages(
          getKeywordUnmatchPageDto,
        );
        expect(channelList.channels).toBe('[]');
        expect(channelList).toHaveProperty('currentPage');
        expect(channelList).toHaveProperty('totalPage');
        expect(channelList.currentPage).toBe('currentPage');
        expect(channelList.totalPage).toBe('totalPage');
      });
    });

    describe('채팅방 참여자 목록 조회', () => {
      it('[Valid Case] 채팅방 참여자 목록 조회', async () => {
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = basicChannel.users.get(1);
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
        expect(participants.participants).toHaveProperty('nickname');
        expect(participants.participants).toHaveProperty('imgUrl');
        expect(participants.participants).toHaveProperty('roleType');
        expect(participants.participants).toHaveProperty('isMuted');
        expect(participants).toHaveProperty('headCount');
        expect(participants).toHaveProperty('maxHeadCount');
      });
      it('[Error Case] 채팅방에 없는 유저의 요청', async () => {
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = await testData.createBasicUser();
        const getChannelParticipantsRequest: GetChannelParticipantsDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await expect(
          service.getChannelParticipants(getChannelParticipantsRequest),
        ).rejects.toThrow(new BadRequestException());
      });
    });

    describe('채팅방 생성', () => {
      it('[Valid Case] 채팅방 생성(public)', async () => {
        const user = await testData.createBasicUser();
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PUBLIC,
          password: null,
          maxHeadCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { owner: { id: user.id } },
        });

        expect(savedChannelDb.operator.id).toBe(user.id);
        expect(savedChannelDb.name).toBe(postChannelRequest.name);
        expect(savedChannelDb.type).toBe(postChannelRequest.access);
        expect(savedChannelDb.name).toBe(postChannelRequest.name);
        expect(savedChannelDb.password).toBe(null);
        expect(savedChannelDb.maxHeadCount).toBe(
          postChannelRequest.maxHeadCount,
        );

        const savedChannelFt: ChannelModel =
          channelFactory.findChannelByChannelName(savedChannelDb.name);

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.name);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.name);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(
          postChannelRequest.maxHeadCount,
        );
      });

      it('[Valid Case] 채팅방 생성(protected)', async () => {
        const user = await testData.createBasicUser();
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PROTECTED,
          password: 'null',
          maxHeadCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { owner: { id: user.id } },
        });

        expect(savedChannelDb.operator.id).toBe(user.id);
        expect(savedChannelDb.name).toBe(postChannelRequest.name);
        expect(savedChannelDb.type).toBe(postChannelRequest.access);
        expect(savedChannelDb.name).toBe(postChannelRequest.name);
        expect(savedChannelDb.password).toBe(postChannelRequest.password);
        expect(savedChannelDb.maxHeadCount).toBe(
          postChannelRequest.maxHeadCount,
        );

        const savedChannelFt: ChannelModel =
          channelFactory.findChannelByChannelName(savedChannelDb.name);

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.name);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.name);
        expect(savedChannelFt.password).toBe(postChannelRequest.password);
        expect(savedChannelFt.maxHeadCount).toBe(
          postChannelRequest.maxHeadCount,
        );
      });

      it('[Valid Case] 채팅방 생성(private)', async () => {
        const user = await testData.createBasicUser();
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PUBLIC,
          password: 'null',
          maxHeadCount: 10,
        };

        await service.postChannel(postChannelRequest);

        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { owner: { id: user.id } },
        });

        expect(savedChannelDb.operator.id).toBe(user.id);
        expect(savedChannelDb.name).toBe(postChannelRequest.name);
        expect(savedChannelDb.type).toBe(postChannelRequest.access);
        expect(savedChannelDb.name).toBe(postChannelRequest.name);
        expect(savedChannelDb.password).toBe(null);
        expect(savedChannelDb.maxHeadCount).toBe(
          postChannelRequest.maxHeadCount,
        );

        const savedChannelFt: ChannelModel =
          channelFactory.findChannelByChannelName(savedChannelDb.name);

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.name);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.name);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(
          postChannelRequest.maxHeadCount,
        );
      });

      it('[Error Case] 채팅방 생성 - 이름이 중복된 경우', async () => {
        const user = await testData.createBasicUser();
        const user2 = await testData.createBasicUser();
        const postChannelRequest: PostChannelDto = {
          userId: user.id,
          title: 'channel',
          access: CHANNEL_PUBLIC,
          password: null,
          maxHeadCount: 10,
        };
        const duplicatedRequest: PostChannelDto = {
          userId: user2.id,
          title: 'channel',
          access: CHANNEL_PUBLIC,
          password: null,
          maxHeadCount: 10,
        };

        await service.postChannel(postChannelRequest);

        await expect(service.postChannel(duplicatedRequest)).rejects.toThrow(
          new BadRequestException(),
        );

        const savedChannelFt: ChannelModel =
          channelFactory.findChannelByChannelName(savedChannelDb.name);

        expect(savedChannelFt.ownerId).toBe(user.id);
        expect(savedChannelFt.name).toBe(postChannelRequest.name);
        expect(savedChannelFt.type).toBe(postChannelRequest.access);
        expect(savedChannelFt.name).toBe(postChannelRequest.name);
        expect(savedChannelFt.password).toBe(null);
        expect(savedChannelFt.maxHeadCount).toBe(
          postChannelRequest.maxHeadCount,
        );
      });
    });
  });
});
