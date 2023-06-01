import { Test, TestingModule } from '@nestjs/testing';
import { ChannelUserService } from './channel-user.service';
import { ChannelFactory } from '../channel/channel.factory';
import { UserFactory } from '../user/user.factory';
import { Repository } from 'typeorm';
import { Channel } from 'diagnostics_channel';
import { ChannelUserModule } from './channel-user.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChannelModel } from '../channel/channel.model';
import { UserModel } from '../user/user.model';
import { BadRequestException } from '@nestjs/common';
import { CHANNEL_PROTECTED } from 'src/global/type/type.channel';
import { CHANNEL_PRIVATE } from 'src/global/type/type.channel';
import { CHANNEL_PUBLIC } from 'src/global/type/type.channel';

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

  describe('관리자 기능', () => {
    describe('관리자 임명 / 해제', () => {
      it('[Valid Case] 관리자 임명', async () => {
        const channel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = userFactory.users.get(channel.users[1]);

        const postAdminRequest: PostChannelAdminDto = {
          requestUserId: channel.ownerId,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.postChannelAdmin(postAdminRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.adminList).toContain(user.id);
      });

      it('[Valid Case] 관리자 해제', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins();
        const user: UserModel = userFactory.users.get(channel.users[1]);

        const deleteAdminRequest: DeleteChannelAdminDto = {
          requestUserId: channel.ownerId,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.deleteChannelAdmin(deleteAdminRequest);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.adminList).not.toContain(user.id);
      });
    });

    describe('KICK TEST', () => {
      it('[Valid Case] 일반 유저 강퇴', async () => {
        const channel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = userFactory.users.get(channel.users[1]);

        const deleteUserInChannelRequest: DeleteChannelKickDto = {
          requestUserId: channel.ownerId,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.deleteChannelKick(deleteUserInChannelRequest);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findUserById(user.id);
        expect(savedChannelFt.users).not.toContain(user.id);
        expect(savedUserFt.joinedChannel).toBeNull();
      });
      it('[Valid Case] owner가 관리자를 강퇴', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins();
        const user: UserModel = userFactory.users.get(channel.users[1]);

        const deleteUserInChannelRequest: DeleteChannelKickDto = {
          requestUserId: channel.ownerId,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.deleteChannelKick(deleteUserInChannelRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        expect(savedChannelFt.users).not.toContain(user.id);
        expect(savedChannelFt.adminList).not.toContain(user.id);
        expect(savedUserFt.joinedChannel).toBeNull();
      });
      it('[Error Case] 관리자가 관리자를 강퇴', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins();
        const user: UserModel = userFactory.users.get(channel.users[2]);

        const deleteUserInChannelRequest: DeleteChannelKickDto = {
          requestUserId: channel.users[1],
          channelId: channel.id,
          targetUserId: user.id,
        };

        await expect(
          service.deleteChannelKick(deleteUserInChannelRequest),
        ).rejects.toThrow(new BadRequestException());
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        expect(savedChannelFt.users).toContain(user.id);
        expect(savedChannelFt.adminList).toContain(user.id);
        expect(savedUserFt.joinedChannel).toBe(channel.id);
      });
    });

    describe('BAN TEST', () => {
      it('[Valid Case] 일반 유저 BAN', async () => {
        const channel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = userFactory.users.get(channel.users[1]);

        const postChannelBanRequest: PostChannelBanDto = {
          requestUserId: channel.ownerId,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.postChannelBan(postChannelBanRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findUserById(user.id);

        expect(savedChannelFt.users).not.toContain(user.id);
        expect(savedChannelFt.adminList).not.toContain(user.id);
        expect(savedChannelFt.banList).toContain(user.id);
        expect(savedUserFt.joinedChannel).toBeNull();
      });
      it('[Valid Case] owner가 admin을 BAN', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins();
        const user: UserModel = userFactory.users.get(channel.users[1]);

        const postChannelBanRequest: PostChannelBanDto = {
          requestUserId: channel.ownerId,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.postChannelBan(postChannelBanRequest);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findUserById(user.id);
        expect(savedChannelFt.users).not.toContain(user.id);
        expect(savedChannelFt.adminList).not.toContain(user.id);
        expect(savedChannelFt.banList).toContain(user.id);
        expect(savedUserFt.joinedChannel).toBeNull();
      });
      it('[Error Case] 관리자가 관리자를 강퇴', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins();
        const admin: UserModel = userFactory.users.get(channel.users[1]);
        const user: UserModel = userFactory.users.get(channel.users[2]);

        const postChannelBanRequest: PostChannelBanDto = {
          requestUserId: admin.id,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.postChannelBan(postChannelBanRequest);

        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findUserById(user.id);
        expect(savedChannelFt.users).not.toContain(user.id);
        expect(savedChannelFt.adminList).not.toContain(user.id);
        expect(savedChannelFt.banList).toContain(user.id);
        expect(savedUserFt.joinedChannel).toBeNull();
      });
    });

    describe('MUTE TEST', () => {
      it('[Valid Case] 일반 유저 MUTE', async () => {
        const channel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = userFactory.users.get(channel.users[1]);

        const postChannelMuteRequest: PostChannelMuteDto = {
          requestUserId: channel.ownerId,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.postChannelMute(postChannelMuteRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.users).toContain(user.id);
        expect(savedChannelFt.muteList).toContain(user.id);
      });
      it('[Error Case] 관리자가 관리자를 MUTE', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins();
        const admin: UserModel = userFactory.users.get(channel.users[1]);
        const user: UserModel = userFactory.users.get(channel.users[2]);

        const postChannelMuteRequest: PostChannelMuteDto = {
          requestUserId: admin.id,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await expect(
          service.postChannelMute(postChannelMuteRequest),
        ).rejects.toThrow(new BadRequestException());
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.users).toContain(user.id);
        expect(savedChannelFt.muteList).not.toContain(user.id);
      });
    });

    describe('UNMUTE TEST', () => {
      it('[Valid Case] 일반 유저 UNMUTE', async () => {
        const channel: ChannelModel = await testData.createChannelWithMuteds();
        const user: UserModel = userFactory.users.get(channel.users[1]);

        const deleteChannelMuteRequest: DeleteChannelMuteDto = {
          requestUserId: channel.ownerId,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await service.deleteChannelMute(deleteChannelMuteRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.users).toContain(user.id);
        expect(savedChannelFt.muteList).not.toContain(user.id);
      });
      it('[Error Case] 관리자가 관리자를 UNMUTE', async () => {
        const channel: ChannelModel =
          await testData.createChannelWithMutedAdmins();
        const admin: UserModel = userFactory.users.get(channel.users[1]);
        const user: UserModel = userFactory.users.get(channel.users[2]);

        const deleteChannelMuteRequest: DeleteChannelMuteDto = {
          requestUserId: admin.id,
          channelId: channel.id,
          targetUserId: user.id,
        };

        await expect(
          service.deleteChannelMute(deleteChannelMuteRequest),
        ).rejects.toThrow(new BadRequestException());
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.users).toContain(user.id);
        expect(savedChannelFt.muteList).toContain(user.id);
      });
    });

    describe('채팅방 삭제', () => {
      it('[Valid Case] 채팅방 삭제(오너가 삭제하는 경우)', async () => {
        const channel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = userFactory.users.get(channel.ownerId);

        const deleteChannelRequest: DeleteChannelDto = {
          userId: user.id,
          channelId: channel.id,
        };

        await service.deleteChannel(deleteChannelRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.users).toContain(user.id);
        expect(savedChannelFt.muteList).toContain(user.id);
      });
    });
    describe('채팅방 수정', () => {
      it('[Valid Case] public -> private', async () => {
        const channel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = userFactory.users.get(channel.ownerId);

        const patchChannelRequest: patchChannelDto = {
          userId: user.id,
          channelId: channel.id,
          password: null,
          access: CHANNEL_PRIVATE,
        };

        await service.patchChannel(patchChannelRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PRIVATE);
      });
      it('[Valid Case] public -> protected', async () => {
        const channel: ChannelModel = await testData.createBasicChannel();
        const user: UserModel = userFactory.users.get(channel.ownerId);

        const patchChannelRequest: patchChannelDto = {
          userId: user.id,
          channelId: channel.id,
          password: '1234',
          access: CHANNEL_PROTECTED,
        };

        await service.patchChannel(patchChannelRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PROTECTED);
        expect(savedChannelFt.password).toBe('1234');
      });
      it('[Valid Case] private -> public', async () => {
        const channel: ChannelModel = await testData.createPrivateChannel();

        const patchChannelRequest: patchChannelDto = {
          userId: channel.ownerId,
          channelId: channel.id,
          password: null,
          access: CHANNEL_PUBLIC,
        };

        await service.patchChannel(patchChannelRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PUBLIC);
      });
      it('[Valid Case] private -> protected', async () => {
        const channel: ChannelModel = await testData.createPrivateChannel();

        const patchChannelRequest: patchChannelDto = {
          userId: channel.ownerId,
          channelId: channel.id,
          password: '1234',
          access: CHANNEL_PROTECTED,
        };

        await service.patchChannel(patchChannelRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PUBLIC);
        expect(savedChannelFt.password).toBe('1234');
      });
      it('[Valid Case] protected -> public', async () => {
        const channel: ChannelModel = await testData.createPrivateChannel();

        const patchChannelRequest: patchChannelDto = {
          userId: channel.ownerId,
          channelId: channel.id,
          password: null,
          access: CHANNEL_PUBLIC,
        };

        await service.patchChannel(patchChannelRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PUBLIC);
        expect(savedChannelFt.password).toBe(null);
      });
      it('[Valid Case] protected -> private', async () => {
        const channel: ChannelModel = await testData.createPrivateChannel();

        const patchChannelRequest: patchChannelDto = {
          userId: channel.ownerId,
          channelId: channel.id,
          password: null,
          access: CHANNEL_PRIVATE,
        };

        await service.patchChannel(patchChannelRequest);
        const savedChannelFt: ChannelModel = channelFactory.findChannelById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PRIVATE);
        expect(savedChannelFt.password).toBe(null);
      });
    });
  });
});