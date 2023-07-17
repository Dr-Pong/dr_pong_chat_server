import { Test, TestingModule } from '@nestjs/testing';
import { ChannelModel } from '../../../domain/factory/model/channel.model';
import { UserModel } from '../../../domain/factory/model/user.model';
import { Channel } from '../../../domain/channel/entity/channel.entity';
import { BadRequestException } from '@nestjs/common';
import { ChannelFactory } from '../../../domain/factory/channel.factory';
import { UserFactory } from '../../../domain/factory/user.factory';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ChannelInviteModel } from '../../../domain/factory/model/channel.invite.model';
import { ChannelTestData as ChannelData } from '../../data/channel.test.data';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { GatewayModule } from 'src/gateway/gateway.module';
import { FactoryModule } from '../../../domain/factory/factory.module';
import { ChannelMessage } from '../../../domain/channel/entity/channel-message.entity';
import { ChannelUser } from '../../../domain/channel/entity/channel-user.entity';
import { PostChannelAcceptInviteDto } from '../../../domain/invitation/dto/post.channel.accept.invite.dto';
import { DeleteChannelInviteDto } from '../../../domain/channel/dto/delete/delete.channel.invite.dto';
import { UserTestData } from 'src/test/data/user.test.data';
import { TestDataModule } from 'src/test/data/test.data.module';
import { User } from 'src/domain/user/user.entity';
import { CHANNEL_PARTICIPANT_NORMAL } from 'src/domain/channel/type/type.channel-participant';
import { PostChannelInviteDto } from 'src/domain/invitation/dto/post.invite.dto';
import { InvitationService } from 'src/domain/invitation/invitation.service';
import { GAMEMODE_CLASSIC } from 'src/domain/invitation/type/type.game.mode';
import { USERSTATUS_INGAME } from 'src/global/type/type.user.status';
import { DeleteGameInviteRejectDto } from 'src/domain/invitation/dto/delete.game.invite.reject.dto';
import { GameInviteModel } from 'src/domain/factory/model/game.invite.model';
import { InvitationModule } from 'src/domain/invitation/invitation.module';

describe('InvitationService', () => {
  let service: InvitationService;
  let channelFactory: ChannelFactory;
  let userFactory: UserFactory;
  let userData: UserTestData;
  let channelData: ChannelData;
  let dataSource: DataSource;
  let channelUserRepository: Repository<ChannelUser>;

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
        InvitationModule,
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

    service = module.get<InvitationService>(InvitationService);
    userData = module.get<UserTestData>(UserTestData);
    channelData = module.get<ChannelData>(ChannelData);
    channelFactory = module.get<ChannelFactory>(ChannelFactory);
    userFactory = module.get<UserFactory>(UserFactory);
    dataSource = module.get<DataSource>(DataSource);
    channelUserRepository = module.get<Repository<ChannelUser>>(
      getRepositoryToken(ChannelUser),
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

  describe('채팅 초대', () => {
    /**
     * 채팅방 초대
     * 유저를 초대하면 UserModel의 inviteList에 초대받은 채팅방이 추가되어야 한다.
     * 초대를 수락하면 UserModel의 inviteList에서 해당 채팅방이 삭제되어야 한다.
     * 초대를 거절하면 UserModel의 inviteList에서 해당 채팅방이 삭제되어야 한다.
     * 초대를 수락하면 채널 입장 성공과 동일하게 처리된다.
     * 초대를 거절하면 ChannelUser에 유저가 추가되지 않아야 한다.
     * 초대를 거절하면 Channel의 headCount가 증가하지 않아야 한다.
     * 초대를 거절하면 ChannelModel의 users에 유저가 추가되지 않아야 한다.
     * 채널의 정원이 초과되면 초대를 수락해도 채널에 입장할 수 없다.
     * 채널에서 ban된 유저는 초대를 수락할 수 없다.
     */
    describe('채팅방 초대', () => {
      it('[Valid Case] 일반 유저 초대', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'chanel',
          5,
        );
        const user: User = await userData.createUser('user');

        const inviteRequest: PostChannelInviteDto = {
          userId: basicChannel.ownerId,
          channelId: basicChannel.id,
          targetId: user.id,
        };

        service.postChannelInvite(inviteRequest);

        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedUserFt.channelInviteList.size).toBe(1);
      });

      it('[Valid Case] public 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          6,
        );
        const user: User = await userData.createUser('user');
        const invite: ChannelInviteModel = new ChannelInviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );

        userFactory.inviteChannel(user.id, invite);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);

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

        const savedUserFt: UserModel = userFactory.findById(user.id);
        const savedChannelFt: ChannelModel = channelFactory.findById(
          basicChannel.id,
        );

        expect(savedUserFt.channelInviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });

      it('[Valid Case] private 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel =
          await channelData.createPrivateChannel('channel', 5);
        const user: User = await userData.createUser('user');
        const invite: ChannelInviteModel = new ChannelInviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.inviteChannel(user.id, invite);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);
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

        const savedUserFt: UserModel = userFactory.findById(user.id);

        const savedChannelFt: ChannelModel = channelFactory.findById(
          basicChannel.id,
        );

        expect(savedUserFt.channelInviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });

      it('[Valid Case] protected 채팅방 초대 수락', async () => {
        const basicChannel: ChannelModel =
          await channelData.createProtectedChannel('channel', 6);
        const user: User = await userData.createUser('user');
        const invite: ChannelInviteModel = new ChannelInviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.inviteChannel(user.id, invite);

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

        expect(savedUserFt.channelInviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(basicChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);
      });

      it('[Valid Case] 이미 채팅방에 있는데 다른 채팅방 초대 수락한 경우', async () => {
        const user: UserModel = await channelData.createUserInChannel(8);
        const pastChannel: ChannelModel = channelFactory.findById(
          user.joinedChannel,
        );
        const inviteChannel: ChannelModel =
          await channelData.createBasicChannel('inviteChannel', 6);
        const invite: ChannelInviteModel = new ChannelInviteModel(
          inviteChannel.id,
          inviteChannel.name,
          inviteChannel.ownerId.toString(),
        );

        userFactory.inviteChannel(user.id, invite);

        const InviteAcceptRequest: PostChannelAcceptInviteDto = {
          userId: user.id,
          channelId: inviteChannel.id,
        };

        await service.postChannelAcceptInvite(InviteAcceptRequest);

        const savedChannelUserDb: ChannelUser[] =
          await channelUserRepository.find({
            where: {
              user: { id: user.id },
              channel: { id: inviteChannel.id },
              isDeleted: false,
            },
          });

        expect(savedChannelUserDb.length).toBe(1);
        expect(savedChannelUserDb[0].roleType).toBe(CHANNEL_PARTICIPANT_NORMAL);

        const savedUserFt: UserModel = userFactory.findById(user.id);
        const savedChannelFt: ChannelModel = channelFactory.findById(
          inviteChannel.id,
        );

        expect(savedUserFt.channelInviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(inviteChannel.id);
        expect(savedChannelFt.users.has(user.id)).toBe(true);

        const pastChannelFt: ChannelModel = channelFactory.findById(
          pastChannel.id,
        );

        expect(pastChannelFt.users.size).toBe(7);
        expect(pastChannelFt.users.has(user.id)).toBe(false);
      });

      it('[Valid Case] 채팅방 초대 거절', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          6,
        );
        const user: User = await userData.createUser('user');
        const invite: ChannelInviteModel = new ChannelInviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.inviteChannel(user.id, invite);

        const deleteInviteRequest: DeleteChannelInviteDto = {
          userId: user.id,
          channelId: basicChannel.id,
        };

        await service.deleteChannelInvite(deleteInviteRequest);
        const savedUserFt: UserModel = userFactory.findById(user.id);

        expect(savedUserFt.channelInviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
      });

      it('[Error Case] BAN 목록에 있는 유저가 초대 수락한 경우', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          6,
        );
        const user: User = await userData.createUser('user');
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

        expect(savedUserFt.channelInviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
        expect(savedChannelFt.users.has(user.id)).toBe(false);
      });

      it('[Error Case] 수락했는데 채팅방이 꽉 찬 경우', async () => {
        const basicChannel: ChannelModel = await channelData.createBasicChannel(
          'channel',
          10,
        );
        const user: User = await userData.createUser('user');
        const invite: ChannelInviteModel = new ChannelInviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.inviteChannel(user.id, invite);

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

        expect(savedUserFt.channelInviteList.size).toBe(0);
        expect(savedUserFt.joinedChannel).toBe(null);
        expect(savedChannelFt.users.has(user.id)).toBe(false);
      });

      it('[Valid Case] 초대 목록(초대가 있는 경우)', async () => {
        const user: UserModel = await channelData.createInvitePendingUser(10);
        const { invitations } = await service.getChannelInviteList({
          userId: user.id,
        });

        expect(invitations.length).toBe(10);
      });

      it('[Valid Case] 초대 목록(초대가 없는 경우)', async () => {
        const { id } = await userData.createUser('user');
        const { invitations } = await service.getChannelInviteList({
          userId: id,
        });
        expect(invitations.length).toBe(0);
      });
    });
  });

  describe('게임 초대', () => {
    it('[Valid Case] 일반 게임 초대 성공', async () => {
      const user1: User = await userData.createUser('user1');
      const user2: User = await userData.createUser('user2');
      const postDto = {
        senderId: user1.id,
        receiverId: user2.id,
        mode: GAMEMODE_CLASSIC,
      };

      await service.postGameInvite(postDto);
      const savedUserFt: UserModel = userFactory.findById(userData.users[0].id);

      expect(savedUserFt.gameInvite.receiverId).toBe(userData.users[1].id);
    });

    it('[Error Case] 이미 초대된 유저에게 초대 불가능', async () => {
      const user1: User = await userData.createUser('user1');
      const user2: User = await userData.createUser('user2');
      const newInvite: GameInviteModel = new GameInviteModel(
        user1.id,
        user2.id,
        GAMEMODE_CLASSIC,
      );
      userFactory.inviteGame(user1.id, user2.id, newInvite);

      const postDto = {
        senderId: user1.id,
        receiverId: user2.id,
        mode: GAMEMODE_CLASSIC,
      };

      await expect(service.postGameInvite(postDto)).rejects.toThrow(
        new BadRequestException('already invited'),
      );
    });

    it('[Error Case] 게임 중인 유저에게 초대 불가능', async () => {
      const user1: User = await userData.createUser('user1');
      const user2: User = await userData.createUser('user2');
      userFactory.setStatus(user2.id, USERSTATUS_INGAME);

      const postDto = {
        senderId: user1.id,
        receiverId: user2.id,
        mode: GAMEMODE_CLASSIC,
      };

      await expect(service.postGameInvite(postDto)).rejects.toThrow(
        new BadRequestException('already in game'),
      );
    });
  });

  describe('게임 초대 삭제', () => {
    it('[Valid Case] 게임 초대 삭제 성공', async () => {
      const user1: User = await userData.createUser('user1');
      const user2: User = await userData.createUser('user2');
      const newInvite: GameInviteModel = new GameInviteModel(
        user1.id,
        user2.id,
        GAMEMODE_CLASSIC,
      );
      userFactory.inviteGame(user1.id, user2.id, newInvite);

      const deleteDto = {
        senderId: user1.id,
        receiverId: user2.id,
      };

      await service.deleteGameInvite(deleteDto);
      const savedUserFt: UserModel = userFactory.findById(userData.users[0].id);
      const receivedUserFt: UserModel = userFactory.findById(
        userData.users[1].id,
      );

      expect(savedUserFt.gameInvite).toBeNull();
      expect(receivedUserFt.gameInviteList.size).toBe(0);
    });
  });
  describe('게임 초대 수락', () => {
    it.skip('[Valid Case] 게임 초대 수락 성공', async () => {
      const user1: User = await userData.createUser('user1');
      const user2: User = await userData.createUser('user2');
      const newInvite: GameInviteModel = new GameInviteModel(
        user1.id,
        user2.id,
        GAMEMODE_CLASSIC,
      );
      userFactory.inviteGame(user1.id, user2.id, newInvite);

      const postDto = {
        userId: user2.id,
        inviteId: newInvite.id,
      };

      await service.postGameInviteAccept(postDto);

      const sendUserFt: UserModel = userFactory.findById(user1.id);
      const receivedUserFt: UserModel = userFactory.findById(user2.id);

      expect(sendUserFt.gameInvite).toBeNull();
      expect(receivedUserFt.gameInviteList.size).toBe(0);
    });

    it('[Error Case] 유효하지 않은 초대 수락', async () => {
      const user1: User = await userData.createUser('user1');
      const user2: User = await userData.createUser('user2');
      const newInvite: GameInviteModel = new GameInviteModel(
        user1.id,
        user2.id,
        GAMEMODE_CLASSIC,
      );
      userFactory.inviteGame(user1.id, user2.id, newInvite);

      const postDto = {
        userId: user2.id,
        inviteId: 'invalidId',
      };

      await expect(service.postGameInviteAccept(postDto)).rejects.toThrow(
        new BadRequestException('invalid invite'),
      );
    });
  });
  describe('게임 초대 거절', () => {
    it('[Valid Case] 게임 초대 거절 성공', async () => {
      const user1: User = await userData.createUser('user1');
      const user2: User = await userData.createUser('user2');
      const newInvite: GameInviteModel = new GameInviteModel(
        user1.id,
        user2.id,
        GAMEMODE_CLASSIC,
      );
      userFactory.inviteGame(user1.id, user2.id, newInvite);

      const deleteDto: DeleteGameInviteRejectDto = {
        userId: user2.id,
        inviteId: newInvite.id,
      };

      await service.deleteGameInviteReject(deleteDto);

      const sendUserFt: UserModel = userFactory.findById(user1.id);
      const receivedUserFt: UserModel = userFactory.findById(user2.id);

      expect(sendUserFt.gameInvite).toBeNull();
      expect(receivedUserFt.gameInviteList.size).toBe(0);
    });
  });
});
