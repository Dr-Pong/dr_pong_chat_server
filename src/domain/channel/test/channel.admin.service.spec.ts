import { Test, TestingModule } from '@nestjs/testing';
import { ChannelFactory } from '../../factory/channel.factory';
import { UserFactory } from '../../factory/user.factory';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ChannelModel } from '../../factory/model/channel.model';
import { UserModel } from '../../factory/model/user.model';
import { BadRequestException } from '@nestjs/common';
import { CHANNEL_PROTECTED } from 'src/domain/channel/type/type.channel';
import { CHANNEL_PRIVATE } from 'src/domain/channel/type/type.channel';
import { CHANNEL_PUBLIC } from 'src/domain/channel/type/type.channel';
import { DeleteChannelAdminDto } from '../dto/delete/delete.channel.admin.dto';
import { ChannelTestService } from '../test/channel.test.service';
import { ChannelUser } from '../entity/channel-user.entity';
import { FactoryModule } from '../../factory/factory.module';
import { GatewayModule } from 'src/gateway/gateway.module';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import {
  CHAT_BAN,
  CHAT_KICK,
  CHAT_MUTE,
  CHAT_SETADMIN,
  CHAT_UNSETADMIN,
} from 'src/domain/channel/type/type.channel.action';
import { ChannlTestModule } from '../test/channel.test.module';
import { Channel } from '../entity/channel.entity';
import { ChannelMessage } from '../entity/channel-message.entity';
import { PostChannelAdminDto } from '../dto/post/post.channel.admin.dto';
import { ChannelAdminService } from '../service/channel.admin.service';
import { DeleteChannelKickDto } from '../dto/delete/delete.channel.kick.dto';
import { PostChannelBanDto } from '../dto/post/post.channel.ban.dto';
import { PostChannelMuteDto } from '../dto/post/post.channel.mute.dto';
import { DeleteChannelMuteDto } from '../dto/delete/delete.channel.mute.dto';
import { PatchChannelDto } from '../dto/patch/patch.channel.dto';
import { DeleteChannelDto } from '../dto/delete/delete.channel.dto';
import { ChannelModule } from '../channel.module';

describe('ChannelUserService', () => {
  let service: ChannelAdminService;
  let channelFactory: ChannelFactory;
  let userFactory: UserFactory;
  let testData: ChannelTestService;
  let dataSource: DataSource;
  let channelRepository: Repository<Channel>;
  let channelMessageRepository: Repository<ChannelMessage>;

  initializeTransactionalContext();
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ChannlTestModule,
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

    service = module.get<ChannelAdminService>(ChannelAdminService);
    channelFactory = module.get<ChannelFactory>(ChannelFactory);
    userFactory = module.get<UserFactory>(UserFactory);
    testData = module.get<ChannelTestService>(ChannelTestService);
    dataSource = module.get<DataSource>(DataSource);
    channelRepository = module.get<Repository<Channel>>(
      getRepositoryToken(Channel),
    );
    channelMessageRepository = module.get<Repository<ChannelMessage>>(
      getRepositoryToken(ChannelMessage),
    );
    await dataSource.synchronize(true);
  });

  afterEach(async () => {
    userFactory.users.clear();
    channelFactory.channels.clear();
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('관리자 기능', () => {
    describe('관리자 임명 / 해제', () => {
      it('[Valid Case] 관리자 임명', async () => {
        const user: UserModel = await testData.createUserInChannel(9);
        const channel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );

        const postAdminRequest: PostChannelAdminDto = new PostChannelAdminDto(
          channel.ownerId,
          channel.id,
          user.id,
        );

        await service.postChannelAdmin(postAdminRequest);
        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              channel: { id: channel.id },
              user: { id: user.id },
              type: CHAT_SETADMIN,
            },
          });

        expect(savedMessage.content).toBe('setadmin');
        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.adminList.has(user.id)).toBe(true);
      });

      it('[Valid Case] 관리자 해제', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins(9);
        const iteratror = channel.users.values();
        iteratror.next();
        const user: UserModel = userFactory.findById(iteratror.next().value);

        const deleteAdminRequest: DeleteChannelAdminDto =
          new DeleteChannelAdminDto(channel.ownerId, channel.id, user.id);
        await service.deleteChannelAdmin(deleteAdminRequest);
        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              channel: { id: channel.id },
              user: { id: user.id },
              type: CHAT_UNSETADMIN,
            },
          });
        expect(savedMessage.content).toBe('unsetadmin');

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.adminList).not.toContain(user.id);
      });
    });

    describe('KICK TEST', () => {
      it('[Valid Case] 일반 유저 강퇴', async () => {
        const user: UserModel = await testData.createUserInChannel(9);
        const channel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );

        const deleteUserInChannelRequest: DeleteChannelKickDto =
          new DeleteChannelKickDto(channel.ownerId, channel.id, user.id);

        await service.deleteChannelKick(deleteUserInChannelRequest);
        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              channel: { id: channel.id },
              user: { id: user.id },
              type: CHAT_KICK,
            },
          });

        expect(savedMessage.content).toBe('kick');

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findById(user.id);
        expect(savedChannelFt.users).not.toContain(user.id);
        expect(savedUserFt.joinedChannel).toBeNull();
      });
      it('[Valid Case] owner가 관리자를 강퇴', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins(7);
        const iterator = channel.adminList.values();
        iterator.next();
        const user: UserModel = userFactory.findById(iterator.next().value);

        const deleteUserInChannelRequest: DeleteChannelKickDto =
          new DeleteChannelKickDto(channel.ownerId, channel.id, user.id);

        await service.deleteChannelKick(deleteUserInChannelRequest);
        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              channel: { id: channel.id },
              user: { id: user.id },
              type: CHAT_KICK,
            },
          });

        expect(savedMessage.content).toBe('kick');

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedChannelFt.users.has(user.id)).toBe(false);
        expect(savedChannelFt.adminList.has(user.id)).toBe(false);
        expect(savedUserFt.joinedChannel).toBeNull();
      });

      it('[Error Case] 관리자가 관리자를 강퇴', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins(7);
        const iterator = channel.adminList.values();
        iterator.next();
        const user: UserModel = userFactory.findById(iterator.next().value);

        const deleteUserInChannelRequest: DeleteChannelKickDto =
          new DeleteChannelKickDto(iterator.next().value, channel.id, user.id);

        await expect(
          service.deleteChannelKick(deleteUserInChannelRequest),
        ).rejects.toThrow(
          new BadRequestException('You cannot access to same role'),
        );
        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedChannelFt.users.has(user.id)).toBe(true);
        expect(savedChannelFt.adminList.has(user.id)).toBe(true);
        expect(savedUserFt.joinedChannel).not.toBeNull();
      });
    });

    describe('BAN TEST', () => {
      it('[Valid Case] 일반 유저 BAN', async () => {
        const user: UserModel = await testData.createUserInChannel(9);
        const channel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );

        const postChannelBanRequest: PostChannelBanDto = new PostChannelBanDto(
          channel.ownerId,
          channel.id,
          user.id,
        );

        await service.postChannelBan(postChannelBanRequest);
        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              channel: { id: channel.id },
              user: { id: user.id },
              type: CHAT_BAN,
            },
          });

        expect(savedMessage.content).toBe('ban');
        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedChannelFt.users.has(user.id)).toBe(false);
        expect(savedChannelFt.adminList.has(user.id)).toBe(false);
        expect(savedChannelFt.banList.has(user.id)).toBe(true);
        expect(savedUserFt.joinedChannel).toBeNull();
      });
      it('[Valid Case] owner가 admin을 BAN', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins(9);
        const iterator = channel.adminList.values();
        iterator.next();
        const user: UserModel = userFactory.findById(iterator.next().value);

        const postChannelBanRequest: PostChannelBanDto = new PostChannelBanDto(
          channel.ownerId,
          channel.id,
          user.id,
        );

        await service.postChannelBan(postChannelBanRequest);
        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              channel: { id: channel.id },
              user: { id: user.id },
              type: CHAT_BAN,
            },
          });

        expect(savedMessage.content).toBe('ban');
        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findById(user.id);
        expect(savedChannelFt.users.has(user.id)).toBe(false);
        expect(savedChannelFt.adminList.has(user.id)).toBe(false);
        expect(savedChannelFt.banList.has(user.id)).toBe(true);
        expect(savedUserFt.joinedChannel).toBeNull();
      });
      it('[Error Case] 관리자가 관리자를 강퇴', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins(7);
        const iterator = channel.adminList.values();
        iterator.next();
        const admin: UserModel = userFactory.findById(iterator.next().value);
        const user: UserModel = userFactory.findById(iterator.next().value);

        const postChannelBanRequest: PostChannelBanDto = new PostChannelBanDto(
          admin.id,
          channel.id,
          user.id,
        );

        await expect(
          service.postChannelBan(postChannelBanRequest),
        ).rejects.toThrow(
          new BadRequestException('You cannot access to same role'),
        );

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );
        const savedUserFt: UserModel = userFactory.findById(user.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
        expect(savedChannelFt.adminList.has(user.id)).toBe(true);
        expect(savedChannelFt.banList.has(user.id)).toBe(false);
        expect(savedUserFt.joinedChannel).not.toBeNull();
      });
    });

    describe('MUTE TEST', () => {
      it('[Valid Case] 일반 유저 MUTE', async () => {
        const user: UserModel = await testData.createUserInChannel(9);
        const channel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );

        const postChannelMuteRequest: PostChannelMuteDto =
          new PostChannelMuteDto(channel.ownerId, channel.id, user.id);

        await service.postChannelMute(postChannelMuteRequest);
        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              channel: { id: channel.id },
              user: { id: user.id },
              type: CHAT_MUTE,
            },
          });
        expect(savedMessage.content).toBe('mute');
        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(true);
        expect(savedChannelFt.muteList.has(user.id)).toBe(true);
      });
      it('[Error Case] 관리자가 관리자를 MUTE', async () => {
        const channel: ChannelModel = await testData.createChannelWithAdmins(7);
        const iterator = channel.adminList.values();
        iterator.next();
        const admin: UserModel = userFactory.findById(iterator.next().value);
        const user: UserModel = userFactory.findById(iterator.next().value);

        const postChannelMuteRequest: PostChannelMuteDto =
          new PostChannelMuteDto(admin.id, channel.id, user.id);

        await expect(
          service.postChannelMute(postChannelMuteRequest),
        ).rejects.toThrow(
          new BadRequestException('You cannot access to same role'),
        );

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(true);
        expect(savedChannelFt.muteList.has(user.id)).toBe(false);
      });
    });

    describe('UNMUTE TEST', () => {
      it('[Valid Case] 일반 유저 UNMUTE', async () => {
        const user: UserModel = await testData.createMutedUserInChannel(9);
        const channel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );

        const deleteChannelMuteRequest: DeleteChannelMuteDto =
          new DeleteChannelMuteDto(channel.ownerId, channel.id, user.id);

        await service.deleteChannelMute(deleteChannelMuteRequest);
        const savedMessage: ChannelMessage =
          await channelMessageRepository.findOne({
            where: {
              channel: { id: channel.id },
              user: { id: user.id },
            },
            order: { id: 'DESC' },
          });
        expect(savedMessage.content).toBe('unmute');
        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(true);
        expect(savedChannelFt.muteList.has(user.id)).toBe(false);
      });
      it('[Error Case] 관리자가 관리자를 UNMUTE', async () => {
        const channel: ChannelModel =
          await testData.createChannelWithMutedAdmins(7);
        const iterator = channel.adminList.values();
        iterator.next();
        const admin: UserModel = userFactory.findById(iterator.next().value);
        const user: UserModel = userFactory.findById(iterator.next().value);

        const deleteChannelMuteRequest: DeleteChannelMuteDto =
          new DeleteChannelMuteDto(admin.id, channel.id, user.id);

        await expect(
          service.deleteChannelMute(deleteChannelMuteRequest),
        ).rejects.toThrow(
          new BadRequestException('You cannot access to same role'),
        );
        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.users.has(user.id)).toBe(true);
        expect(savedChannelFt.muteList.has(user.id)).toBe(true);
      });
    });

    describe('채팅방 수정', () => {
      it('[Valid Case] public -> private', async () => {
        const channel: ChannelModel = await testData.createBasicChannel(
          'public',
          6,
        );
        const user: UserModel = userFactory.users.get(channel.ownerId);

        const patchChannelRequest: PatchChannelDto = new PatchChannelDto(
          user.id,
          channel.id,
          null,
          CHANNEL_PRIVATE,
        );

        await service.patchChannel(patchChannelRequest);
        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { id: channel.id },
        });
        expect(savedChannelDb.type).toBe(CHANNEL_PRIVATE);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PRIVATE);
      });
      it('[Valid Case] public -> protected', async () => {
        const channel: ChannelModel = await testData.createBasicChannel(
          'public',
          6,
        );
        const user: UserModel = userFactory.users.get(channel.ownerId);

        const patchChannelRequest: PatchChannelDto = {
          userId: user.id,
          channelId: channel.id,
          password: '1234',
          access: CHANNEL_PROTECTED,
        };

        await service.patchChannel(patchChannelRequest);
        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { id: channel.id },
        });
        expect(savedChannelDb.type).toBe(CHANNEL_PROTECTED);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PROTECTED);
        expect(savedChannelFt.password).toBe('1234');
      });
      it('[Valid Case] private -> public', async () => {
        const channel: ChannelModel = await testData.createPrivateChannel(
          'private',
          6,
        );

        const patchChannelRequest: PatchChannelDto = new PatchChannelDto(
          channel.ownerId,
          channel.id,
          null,
          CHANNEL_PUBLIC,
        );

        await service.patchChannel(patchChannelRequest);
        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { id: channel.id },
        });
        expect(savedChannelDb.type).toBe(CHANNEL_PUBLIC);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PUBLIC);
      });
      it('[Valid Case] private -> protected', async () => {
        const channel: ChannelModel = await testData.createPrivateChannel(
          'private',
          6,
        );

        const patchChannelRequest: PatchChannelDto = new PatchChannelDto(
          channel.ownerId,
          channel.id,
          '1234',
          CHANNEL_PROTECTED,
        );

        await service.patchChannel(patchChannelRequest);
        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { id: channel.id },
        });
        expect(savedChannelDb.type).toBe(CHANNEL_PROTECTED);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PROTECTED);
        expect(savedChannelFt.password).toBe('1234');
      });
      it('[Valid Case] protected -> public', async () => {
        const channel: ChannelModel = await testData.createProtectedChannel(
          'protected',
          6,
        );

        const patchChannelRequest: PatchChannelDto = new PatchChannelDto(
          channel.ownerId,
          channel.id,
          null,
          CHANNEL_PUBLIC,
        );

        await service.patchChannel(patchChannelRequest);
        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { id: channel.id },
        });
        expect(savedChannelDb.type).toBe(CHANNEL_PUBLIC);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PUBLIC);
        expect(savedChannelFt.password).toBe(null);
      });
      it('[Valid Case] protected -> private', async () => {
        const channel: ChannelModel = await testData.createProtectedChannel(
          'protected',
          6,
        );

        const patchChannelRequest: PatchChannelDto = new PatchChannelDto(
          channel.ownerId,
          channel.id,
          null,
          CHANNEL_PRIVATE,
        );

        await service.patchChannel(patchChannelRequest);
        const savedChannelDb: Channel = await channelRepository.findOne({
          where: { id: channel.id },
        });
        expect(savedChannelDb.type).toBe(CHANNEL_PRIVATE);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          channel.id,
        );

        expect(savedChannelFt.type).toBe(CHANNEL_PRIVATE);
        expect(savedChannelFt.password).toBe(null);
      });
    });
  });

  describe('채팅방 삭제', () => {
    it('[Valid Case] 채팅방 삭제(오너가 삭제하는 경우)', async () => {
      const channel: ChannelModel = await testData.createBasicChannel(
        'public',
        8,
      );
      const user: UserModel = userFactory.users.get(channel.ownerId);

      const deleteChannelRequest: DeleteChannelDto = new DeleteChannelDto(
        user.id,
        channel.id,
      );

      await service.deleteChannel(deleteChannelRequest);
      const savedChannelDb: Channel = await channelRepository.findOne({
        where: { id: channel.id, isDeleted: false },
      });
      expect(savedChannelDb).toBe(null);

      const savedChannelFt: ChannelModel = channelFactory.findById(channel.id);
      expect(savedChannelFt).toBeUndefined();
    });
  });
});
