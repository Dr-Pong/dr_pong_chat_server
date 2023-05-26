import { Test, TestingModule } from '@nestjs/testing';
import { UserChannelService } from './user-channel.service';
import { ChannelFactory } from '../channel/channel.factory';
import { UserFactory } from '../user/user.factory';
import { Repository } from 'typeorm';
import { Channel } from 'diagnostics_channel';
import { UserChannelModule } from './user-channel.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChannelModel } from '../channel/channel.model';
import { UserModel } from '../user/user.model';
import { BadRequestException } from '@nestjs/common';
import { CHANNEL_PROTECTED } from 'src/global/type/type.channel';
import { CHANNEL_PRIVATE } from 'src/global/type/type.channel';
import { CHANNEL_PUBLIC } from 'src/global/type/type.channel';

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
  });
});
