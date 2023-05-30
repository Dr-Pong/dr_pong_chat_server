import { Test, TestingModule } from '@nestjs/testing';
import { ChannelUserService } from './channel-user.service';
import { ChannelModel } from '../channel/channel.model';
import { UserModel } from '../user/user.model';
import {
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
} from 'src/global/type/type.channel';
import { Channel } from '../channel/channel.entity';
import { BadRequestException } from '@nestjs/common';
import { ChannelFactory } from '../channel/channel.factory';
import { ChannelUserModule } from './channel-user.module';
import { UserFactory } from '../user/user.factory';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ChannelUserService', () => {
  let service: ChannelUserService;
  let channelFactory: ChannelFactory;
  let userFactory: UserFactory;
  let channelRepository: Repository<Channel>;
  let testData: ChannelTestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ChannelUserModule],
      providers: [
        {
          provide: getRepositoryToken(Channel),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ChannelUserService>(ChannelUserService);
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
        expect(channelList).toHaveProperty('channels.id');
        expect(channelList).toHaveProperty('channels.title');
        expect(channelList).toHaveProperty('channels.access');
        expect(channelList).toHaveProperty('channels.headcount');
        expect(channelList).toHaveProperty('channels.maxcount');
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
        expect(channelList).toHaveProperty('channels.id');
        expect(channelList).toHaveProperty('channels.title');
        expect(channelList).toHaveProperty('channels.access');
        expect(channelList).toHaveProperty('channels.headcount');
        expect(channelList).toHaveProperty('channels.maxcount');
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
        expect(channelList).toHaveProperty('channels.id');
        expect(channelList).toHaveProperty('channels.title');
        expect(channelList).toHaveProperty('channels.access');
        expect(channelList).toHaveProperty('channels.headcount');
        expect(channelList).toHaveProperty('channels.maxcount');
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
      it('[Valid Case] 채팅방 참여자 목록 조회 (기본)', async () => {
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = basicChannel.users.values().next().value();
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
        expect(participants).toHaveProperty('maxHeadCount');
      });
      it('[Valid Case] 채팅방 참여자 목록 조회 (심화)', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins();
        const user: UserModel = channel.users.values().next().value();
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
        expect(participants.participants[0].id).toBe(user.id);
        expect(participants.participants[0].imgUrl).toBe(user.profileImage);
        expect(participants.participants[0].roleType).toBe('admin');
        expect(participants.participants[0].isMuted).toBe(false);
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
          where: { operator: { id: user.id } },
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
          where: { operator: { id: user.id } },
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
          where: { operator: { id: user.id } },
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

    describe('채팅방 입장', () => {
      it('[Valid Case] public 채팅방 입장', async () => {
        await testData.createBasicChannels();
        const user: UserModel = await testData.createBasicUser();
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          roomId: basicChannel.id,
          password: null,
        };

        await service.postChannelJoin(joinChannelRequest);

        const savedChannelFt: ChannelModel =
          channelFactory.findChannelByChannelName(basicChannel.name);

        expect(savedChannelFt.users.size).toBe(basicChannel.users.size + 1);
      });
      it('[Valid Case] protected 채팅방 입장', async () => {
        await testData.createBasicChannels();
        const user: UserModel = await testData.createBasicUser();
        const basicChannel: ChannelModel =
          await testData.createProtectedChannel();
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          roomId: basicChannel.id,
          password: 'password',
        };

        await service.postChannelJoin(joinChannelRequest);

        const savedChannelFt: ChannelModel =
          channelFactory.findChannelByChannelName(basicChannel.name);

        expect(savedChannelFt.users.size).toBe(basicChannel.users.size + 1);
      });
      it('[Valid Case] 초대가 와있는데 초대 수락 안하고 입장해버린 경우', async () => {
        await testData.createBasicChannels();
        const user: UserModel = await testData.createInvitePendingUser();
        const basicChannel: ChannelModel =
          await testData.createProtectedChannel();
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          roomId: basicChannel.id,
          password: 'password',
        };

        await service.postChannelJoin(joinChannelRequest);

        const savedChannelFt: ChannelModel =
          channelFactory.findChannelByChannelName(basicChannel.name);

        const savedUserFt: UserModel = userFactory.findUserById(user.id);
        expect(savedChannelFt.users.size).toBe(basicChannel.users.size + 1);
        expect(savedUserFt.inviteList.size).toBe(0);
      });
      it('[Error Case] protected 채팅방 입장시 비밀번호가 잘못된 경우', async () => {
        await testData.createBasicChannels();
        const user: UserModel = await testData.createInvitePendingUser();
        const basicChannel: ChannelModel =
          await testData.createProtectedChannel();
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          roomId: basicChannel.id,
          password: 'wrongPassword',
        };

        await expect(
          service.postChannelJoin(joinChannelRequest),
        ).rejects.toThrow(new BadRequestException());
      });
      it('[Error Case] private 채팅방 입장', async () => {
        await testData.createBasicChannels();
        const user: UserModel = await testData.createInvitePendingUser();
        const basicChannel: ChannelModel =
          await testData.createPrivateChannel();
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          roomId: basicChannel.id,
          password: null,
        };

        await expect(
          service.postChannelJoin(joinChannelRequest),
        ).rejects.toThrow(new BadRequestException());
      });
      it('[Error Case] Ban되어 있는 경우', async () => {
        await testData.createBasicChannels();
        const user: UserModel = await testData.createInvitePendingUser();
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        basicChannel.banList.push(user.id);
        const joinChannelRequest: PostChannelJoinDto = {
          userId: user.id,
          roomId: basicChannel.id,
          password: null,
        };

        await expect(
          service.postChannelJoin(joinChannelRequest),
        ).rejects.toThrow(new BadRequestException());
      });
    });

    describe('채팅방 초대', () => {
      it('[Valid Case] 일반 유저 초대', async () => {
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = await testData.createBasicUser();

        const inviteRequest: ChannelInviteDto = {
          userId: user.id,
          roomId: basicChannel.id,
        };

        await service.postInvite(inviteRequest);

        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        expect(savedUserFt.inviteList.length).toBe(1);
      });
      it('[Valid Case] public 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = await testData.createBasicUser();
        user.inviteList.push(basicChannel.id);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          roomId: basicChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.length).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });
      it('[Valid Case] private 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel =
          await testData.createPrivateChannel();
        const user: UserModel = await testData.createBasicUser();
        user.inviteList.push(basicChannel.id);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          roomId: basicChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.length).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });
      it('[Valid Case] protected 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel =
          await testData.createProtectedChannel();
        const user: UserModel = await testData.createBasicUser();
        user.inviteList.push(basicChannel.id);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          roomId: basicChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.length).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });
      it('[Valid Case] 채팅방 초대 거절', async () => {
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = await testData.createBasicUser();
        user.inviteList.push(basicChannel.id);

        const deleteInviteRequest: DeleteChannelInviteDto = {
          userId: user.id,
          roomId: basicChannel.id,
        };

        await service.deleteChannelInvite(deleteInviteRequest);
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.length).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
      });
      it('[Error Case] BAN 목록에 있는 유저가 초대 수락한 경우', async () => {
        const basicChannel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = await testData.createBasicUser();
        basicChannel.banList.push(user.id);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          roomId: basicChannel.id,
        };

        await expect(
          service.postChannelAcceptInvite(InviteAcceptRequest),
        ).rejects.toThrow(new BadRequestException());
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.length).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
        expect(savedChannelFt.users.has(user.id)).toBe(false);
      });
      it('[Error Case] 수락했는데 채팅방이 꽉 찬 경우', async () => {
        const basicChannel: ChannelModel = await testData.createFullChannel();
        const user: UserModel = await testData.createBasicUser();
        basicChannel.banList.push(user.id);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          roomId: basicChannel.id,
        };

        await expect(
          service.postChannelAcceptInvite(InviteAcceptRequest),
        ).rejects.toThrow(new BadRequestException());
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          basicChannel.id,
        );

        expect(savedUserFt.inviteList.length).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
        expect(savedChannelFt.users.has(user.id)).toBe(false);
      });
    });

    describe('채팅 전송', () => {
      it('[Valid Case] 채팅 전송', async () => {
        // expect(service).toBeDefined();
      });
      it('[Error Case] 채팅 전송(Mute된 경우)', async () => {
        // expect(service).toBeDefined();
      });
    });

    describe('채팅방 퇴장', () => {
      it('[Valid Case] 일반 유저가 퇴장하는 경우', async () => {
        const user: UserModel = await testData.createUserInChannel();

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: user.id,
          roomId: user.joinedChannel,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          user.joinedChannel,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(false);
      });
      it('[Valid Case] owner가 퇴장하는 경우', async () => {
        const channel: ChannelModel = await testData.createChannelWithOwner();

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: channel.ownerId,
          roomId: channel.id,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.users.has(channel.ownerId)).toBe(false);
        expect(savedChannelFt.ownerId).toBe(null);
      });
      it('[Valid Case] admin이 퇴장하는 경우', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins();
        const admin: UserModel = userFactory.findUserById(channel.adminList[0]);

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: admin.adminList[0],
          roomId: channel.id,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.users.has(admin.id)).toBe(false);
        expect(savedChannelFt.adminList.length).toBe(
          channel.adminList.length - 1,
        );
      });
      it('[Valid Case] mute 된 유저가 퇴장하는 경우(mute 상태 유지)', async () => {
        const channel: ChannelModel = await testData.createChannelWithMuteds();
        const user: UserModel = userFactory.findUserById(channel.muteList[0]);

        const deleteChannelUserRequest: DeleteChannelUserDto = {
          userId: user.adminList[0],
          roomId: channel.id,
        };

        await service.deleteChannelUser(deleteChannelUserRequest);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(false);
        expect(savedChannelFt.muteList.find((id) => id === user.id)).toBe(
          user.id,
        );
      });
    });
  });
});
