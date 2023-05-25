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
  });
});
