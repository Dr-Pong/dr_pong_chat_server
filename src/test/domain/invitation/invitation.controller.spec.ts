import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import {
  GAMEMODE_CLASSIC,
  GameMode,
} from 'src/domain/invitation/type/type.game.mode';
import { User } from 'src/domain/user/user.entity';
import { TestDataModule } from 'src/test/data/test.data.module';
import { UserTestData } from 'src/test/data/user.test.data';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { FactoryModule } from 'src/domain/factory/factory.module';
import { UserFactory } from 'src/domain/factory/user.factory';
import { GameInviteModel } from 'src/domain/factory/model/game.invite.model';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { ChannelTestData } from 'src/test/data/channel.test.data';
import { ChannelModel } from 'src/domain/factory/model/channel.model';
import { ChannelInviteModel } from 'src/domain/factory/model/channel.invite.model';
import { UserModel } from 'src/domain/factory/model/user.model';
import { ChannelFactory } from 'src/domain/factory/channel.factory';

initializeTransactionalContext();
describe('InvitationController', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userData: UserTestData;
  let channelFactory: ChannelFactory;
  let channelData: ChannelTestData;
  let userFactory: UserFactory;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestDataModule, FactoryModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    userData = module.get<UserTestData>(UserTestData);
    channelData = module.get<ChannelTestData>(ChannelTestData);
    dataSource = module.get<DataSource>(DataSource);
    userFactory = module.get<UserFactory>(UserFactory);
    channelFactory = module.get<ChannelFactory>(ChannelFactory);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  afterEach(async () => {
    userData.clear();
    userFactory.users.clear();
    channelFactory.channels.clear();
    await dataSource.synchronize(true);
  });

  describe('Game Invite', () => {
    describe('[POST] /invitations/games', () => {
      it('일반 게임 초대 성공', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        const token = await userData.giveTokenToUser(user);
        const mode: GameMode = GAMEMODE_CLASSIC;

        const response = await req(token, 'POST', `/invitations/games`, {
          mdoe: mode,
          nickname: target.nickname,
        });

        expect(response.status).toBe(201);
      });

      it('일반 게임 초대 실패 - 이미 초대한 유저', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        const token = await userData.giveTokenToUser(user);
        const mode: GameMode = GAMEMODE_CLASSIC;
        await req(token, 'POST', `/invitations/games`, {
          mdoe: mode,
          nickname: target.nickname,
        });

        const response = await req(token, 'POST', `/invitations/games`, {
          mdoe: mode,
          nickname: target.nickname,
        });

        expect(response.status).toBe(400);
      });

      it('일반 게임 초대 실패 - 자기 자신 초대', async () => {
        const user: User = await userData.createUser('user');
        const token = await userData.giveTokenToUser(user);
        const mode: GameMode = GAMEMODE_CLASSIC;

        const response = await req(token, 'POST', `/invitations/games`, {
          mdoe: mode,
          nickname: user.nickname,
        });
        expect(response.status).toBe(400);
      });
    });
    describe('[PATCH] /invitations/games/:id', () => {
      it.skip('일반 게임 초대 수락 성공 - 통합 테스트를 위해서는 GameServer axios 필요함', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');

        const newInvite: GameInviteModel = new GameInviteModel(
          user.id,
          target.id,
          GAMEMODE_CLASSIC,
        );
        userFactory.inviteGame(user.id, target.id, newInvite);
        const token = await userData.giveTokenToUser(target);

        const response = await req(
          token,
          'PATCH',
          `/invitations/games/${newInvite.id}`,
        );

        expect(response.status).toBe(200); // axios 요청으로 인해 500 에러 발생가능
      });

      it('일반 게임 초대 수락 실패 - 초대가 없는 유저', async () => {
        const user: User = await userData.createUser('user');
        const token = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'PATCH',
          `/invitations/games/${'invalid'}`,
        );

        expect(response.status).toBe(400);
      });

      it('일반 게임 초대 수락 실패 - 초대한 유저가 아닌 유저', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        const token = await userData.giveTokenToUser(target);
        const newInvite: GameInviteModel = new GameInviteModel(
          user.id,
          target.id,
          GAMEMODE_CLASSIC,
        );
        userFactory.inviteGame(user.id, target.id, newInvite);

        const response = await req(
          token,
          'PATCH',
          `/invitations/games/${'invalid'}`,
        );

        expect(response.status).toBe(400);
      });
    });
    describe('[DELETE] /invitations/games', () => {
      it('일반 게임 초대 취소 성공', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        const newInvite: GameInviteModel = new GameInviteModel(
          user.id,
          target.id,
          GAMEMODE_CLASSIC,
        );
        userFactory.inviteGame(user.id, target.id, newInvite);
        const token = await userData.giveTokenToUser(user);

        const response = await req(token, 'DELETE', `/invitations/games`);

        expect(response.status).toBe(200);
      });
    });
    describe('[DELETE] /invitations/games/:id', () => {
      it('일반 게임 초대 거절 성공', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        const newInvite: GameInviteModel = new GameInviteModel(
          user.id,
          target.id,
          GAMEMODE_CLASSIC,
        );
        userFactory.inviteGame(user.id, target.id, newInvite);
        const token = await userData.giveTokenToUser(target);

        const response = await req(
          token,
          'DELETE',
          `/invitations/games/${newInvite.id}`,
        );

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Channel Invite', () => {
    describe('POST /invitations/channels/{roomId}', () => {
      it('[Valid Case] 채널 초대', async () => {
        const user: UserModel = await channelData.createUserInChannel(8);
        const target: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/invitations/channels/${user.joinedChannel}`,
          {
            nickname: target.nickname,
          },
        );

        expect(response.status).toBe(201);
      });

      it('[Error Case] 요상한 채널에서 초대', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        const channel: ChannelModel = await channelData.createBasicChannel(
          'test',
          9,
        );
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/invitations/channels/${channel.id}`,
          {
            nickname: target.nickname,
          },
        );

        expect(response.status).toBe(201);
      });
    });

    describe('PATCH /invitations/channels/{roomId}', () => {
      it('[Valid Case] 채널 초대 수락', async () => {
        const user: UserModel = await channelData.createInvitePendingUser(10);
        const invite: ChannelInviteModel = user.channelInviteList
          .values()
          .next().value;
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'PATCH',
          `/invitations/channels/${invite.channelId}`,
        );

        expect(response.status).toBe(200);
      });

      it('[Valid Case] private 채널 초대 수락', async () => {
        const basicChannel: ChannelModel =
          await channelData.createPrivateChannel('channel', 5);
        const user: User = await userData.createUser('user');
        const invite: ChannelInviteModel = new ChannelInviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.inviteChannel(user.id, invite);

        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'PATCH',
          `/invitations/channels/${invite.channelId}`,
        );

        expect(response.status).toBe(200);
      });

      it('[Error Case] 채널이 꽉찬 경우', async () => {
        const basicChannel: ChannelModel =
          await channelData.createPrivateChannel('channel', 10);
        const user: User = await userData.createUser('user');
        const invite: ChannelInviteModel = new ChannelInviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.inviteChannel(user.id, invite);

        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'PATCH',
          `/invitations/channels/${invite.channelId}`,
        );

        expect(response.status).toBe(400);
      });

      it('[Error Case] 채널이 없는 경우', async () => {
        const invitor: User = await userData.createUser('invitor');
        const user: User = await userData.createUser('user');
        const token: string = await userData.giveTokenToUser(user);
        const invite: ChannelInviteModel = new ChannelInviteModel(
          'channelId',
          'channelName',
          invitor.id.toString(),
        );
        userFactory.inviteChannel(user.id, invite);

        const response = await req(
          token,
          'PATCH',
          `/invitations/channels/${invite.channelId}`,
        );

        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /invitations/channels/{roomId}', () => {
      it('[Valid Case] 채널 초대 목록에서 삭제 성공', async () => {
        const user = await channelData.createInvitePendingUser(10);
        const token = await userData.giveTokenToUser(user);
        const inviteIterator = user.channelInviteList.values();
        inviteIterator.next();
        const invite = inviteIterator.next().value;
        const response = await req(
          token,
          'DELETE',
          `/invitations/channels/${invite.id}`,
        );
        expect(response.status).toBe(200);
      });

      it('[Valid Case] 채널 초대 목록에서 삭제 씹기(없는초대)', async () => {
        const user = await channelData.createInvitePendingUser(10);
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/invitations/channels/invalidid`,
        );
        expect(response.status).toBe(200);
      });
    });
  });

  const req = async (
    token: string,
    method: string,
    url: string,
    body?: object,
  ) => {
    switch (method) {
      case 'GET':
        return request(app.getHttpServer())
          .get(url)
          .set({ Authorization: `Bearer ${token}` });
      case 'POST':
        return request(app.getHttpServer())
          .post(url)
          .set({ Authorization: `Bearer ${token}` })
          .send(body);
      case 'PATCH':
        return request(app.getHttpServer())
          .patch(url)
          .set({ Authorization: `Bearer ${token}` })
          .send(body);
      case 'DELETE':
        return request(app.getHttpServer())
          .delete(url)
          .set({ Authorization: `Bearer ${token}` });
    }
  };
});
