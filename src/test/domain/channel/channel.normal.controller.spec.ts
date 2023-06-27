import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from 'src/app.module';
import { ChannelTestData } from '../../data/channel.test.data';
import { UserModel } from '../../../domain/factory/model/user.model';
import {
  CHANNEL_PRIVATE,
  CHANNEL_PUBLIC,
} from '../../../domain/channel/type/type.channel';
import { ChannelModel } from '../../../domain/factory/model/channel.model';
import { InviteModel } from '../../../domain/factory/model/invite.model';
import { UserFactory } from '../../../domain/factory/user.factory';
import { FactoryModule } from '../../../domain/factory/factory.module';
import { ChannelFactory } from '../../../domain/factory/channel.factory';
import { TestDataModule } from 'src/test/data/test.data.module';
import { UserTestData } from 'src/test/data/user.test.data';
import { User } from 'src/domain/user/user.entity';

describe('ChannelController - Normal', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let userData: UserTestData;
  let channelData: ChannelTestData;
  let userFactory: UserFactory;
  let channelFactory: ChannelFactory;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestDataModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    userData = module.get<UserTestData>(UserTestData);
    channelData = module.get<ChannelTestData>(ChannelTestData);
    dataSources = module.get<DataSource>(DataSource);
    userFactory = module.get<UserFactory>(UserFactory);
    channelFactory = module.get<ChannelFactory>(ChannelFactory);
    await dataSources.synchronize(true);
  });

  afterAll(async () => {
    await dataSources.destroy();
    await app.close();
  });

  afterEach(async () => {
    userData.clear();
    userFactory.users.clear();
    channelFactory.channels.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  describe('[GET]', () => {
    describe('GET /channels?page=&count=&order=&keyword=', () => {
      it('[Valid Case] 일반적인 조회 테스트', async () => {
        await channelData.createBasicChannels(30);

        const response = await req(
          null,
          'GET',
          '/channels?page=1&count=10&order=recent&keyword=',
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('channels');
        expect(response.body).toHaveProperty('currentPage');
        expect(response.body).toHaveProperty('totalPage');
        for (const c of response.body.channels) {
          expect(c).toHaveProperty('id');
          expect(c).toHaveProperty('title');
          expect(c).toHaveProperty('access');
          expect(c).toHaveProperty('headCount');
          expect(c).toHaveProperty('maxCount');
        }
        expect(response.body.channels.length).toBe(10);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPage).toBe(3);
      });

      it('[Valid Case] 채널이 0개인 경우', async () => {
        const response = await req(null, 'GET', '/channels?page=1&count=10');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('channels');
        expect(response.body).toHaveProperty('currentPage');
        expect(response.body).toHaveProperty('totalPage');
        expect(response.body.channels.length).toBe(0);
        expect(response.body.currentPage).toBe(1);
        expect(response.body.totalPage).toBe(1);
      });
    });

    describe('GET /channels/{roomId}/participants', () => {
      it('[Valid Case] 일반적인 조회 테스트', async () => {
        const user: UserModel = await channelData.createUserInChannel(9);
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'GET',
          `/channels/${user.joinedChannel}/participants`,
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('me');
        expect(response.body).toHaveProperty('participants');
        expect(response.body).toHaveProperty('headCount');
        expect(response.body).toHaveProperty('maxCount');
        for (const c of response.body.participants) {
          expect(c).toHaveProperty('nickname');
          expect(c).toHaveProperty('imgUrl');
          expect(c).toHaveProperty('roleType');
          expect(c).toHaveProperty('isMuted');
        }
        expect(response.body.participants.length).toBe(8);
        expect(response.body.headCount).toBe(9);
        expect(response.body.maxCount).toBe(10);
      });

      it('[Error Case] 채널에 참가하지 않은 경우', async () => {
        const user: User = await userData.createUser('user');
        const channel: ChannelModel = await channelData.createBasicChannel(
          'test',
          9,
        );
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'GET',
          `/channels/${channel.id}/participants`,
        );

        expect(response.status).toBe(400);
      });
    });

    describe('POST /channels', () => {
      it('[Valid Case] public 채널 생성', async () => {
        const user: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(token, 'POST', `/channels`, {
          title: 'test',
          access: CHANNEL_PUBLIC,
          password: null,
          maxCount: 10,
        });

        expect(response.status).toBe(201);
      });

      it('[Valid Case] protected 채널 생성', async () => {
        const user: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(token, 'POST', `/channels`, {
          title: 'test',
          access: CHANNEL_PUBLIC,
          password: 'test',
          maxCount: 10,
        });

        expect(response.status).toBe(201);
      });

      it('[Valid Case] private 채널 생성', async () => {
        const user: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(token, 'POST', `/channels`, {
          title: 'test',
          access: CHANNEL_PRIVATE,
          password: 'test',
          maxCount: 10,
        });

        expect(response.status).toBe(201);
      });
    });

    describe('POST /channels/{roomId}/participants', () => {
      it('[Valid Case] public 채널 입장', async () => {
        const channel: ChannelModel = await channelData.createBasicChannel(
          'test',
          9,
        );
        const user: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/channels/${channel.id}/participants`,
          { password: null },
        );

        expect(response.status).toBe(201);
      });

      it('[Valid Case] protected 채널 입장', async () => {
        const channel: ChannelModel = await channelData.createProtectedChannel(
          'test',
          9,
        );
        const user: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/channels/${channel.id}/participants`,
          { password: 'password' },
        );

        expect(response.status).toBe(201);
      });

      it('[Error Case] protected 채널 비번 틀림', async () => {
        const channel: ChannelModel = await channelData.createProtectedChannel(
          'test',
          9,
        );
        const user: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/channels/${channel.id}/participants`,
          { password: '' },
        );

        expect(response.status).toBe(400);
      });

      it('[Error Case] private 채널 입장', async () => {
        const channel: ChannelModel = await channelData.createPrivateChannel(
          'test',
          9,
        );
        const user: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/channels/${channel.id}/participants`,
          { password: null },
        );

        expect(response.status).toBe(400);
      });
    });

    describe('DELETE /channels/{roomId}/participants', () => {
      it('[Valid Case] 채널 퇴장', async () => {
        const user: UserModel = await channelData.createUserInChannel(8);
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'DELETE',
          `/channels/${user.joinedChannel}/participants`,
        );

        expect(response.status).toBe(200);
      });

      it('[Error Case] 요상한 채널에서 퇴장', async () => {
        const channel: ChannelModel = await channelData.createBasicChannel(
          'test',
          9,
        );
        const user: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'DELETE',
          `/channels/${channel.id}/participants`,
        );

        expect(response.status).toBe(400);
      });
    });

    describe('POST /channels/{roomId}/invitation/{nickname}', () => {
      it('[Valid Case] 채널 초대', async () => {
        const user: UserModel = await channelData.createUserInChannel(8);
        const target: User = await userData.createUser('nheo');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/channels/${user.joinedChannel}/invitation/${target.nickname}`,
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
          `/channels/${channel.id}/invitation/${target.nickname}`,
        );

        expect(response.status).toBe(201);
      });
    });

    describe('POST /channels/{roomId}/magicpass', () => {
      it('[Valid Case] 채널 초대 수락', async () => {
        const user: UserModel = await channelData.createInvitePendingUser(10);
        const invite: InviteModel = user.inviteList.values().next().value;
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/channels/${invite.channelId}/magicpass`,
        );

        expect(response.status).toBe(201);
      });

      it('[Valid Case] private 채널 초대 수락', async () => {
        const basicChannel: ChannelModel =
          await channelData.createPrivateChannel('channel', 5);
        const user: User = await userData.createUser('user');
        const invite: InviteModel = new InviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.invite(user.id, invite);

        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/channels/${invite.channelId}/magicpass`,
        );

        expect(response.status).toBe(201);
      });

      it('[Error Case] 채널이 꽉찬 경우', async () => {
        const basicChannel: ChannelModel =
          await channelData.createPrivateChannel('channel', 10);
        const user: User = await userData.createUser('user');
        const invite: InviteModel = new InviteModel(
          basicChannel.id,
          basicChannel.name,
          basicChannel.ownerId.toString(),
        );
        userFactory.invite(user.id, invite);

        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'POST',
          `/channels/${invite.channelId}/magicpass`,
        );

        expect(response.status).toBe(400);
      });

      it('[Error Case] 채널이 없는 경우', async () => {
        const invitor: User = await userData.createUser('invitor');
        const user: User = await userData.createUser('user');
        const token: string = await userData.giveTokenToUser(user);
        const invite: InviteModel = new InviteModel(
          'channelId',
          'channelName',
          invitor.id.toString(),
        );
        userFactory.invite(user.id, invite);

        const response = await req(
          token,
          'POST',
          `/channels/${invite.channelId}/magicpass`,
        );

        expect(response.status).toBe(404);
      });
    });

    describe('GET /channels/me', () => {
      it('[Valid Case] 채널 없는 경우', async () => {
        const user: User = await userData.createUser('user');
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(token, 'GET', `/channels/me`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('myChannel');
        expect(response.body.myChannel).toBe(null);
      });

      it('[Valid Case] 채널 있는 경우', async () => {
        const user: UserModel = await channelData.createUserInChannel(9);
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(token, 'GET', `/channels/me`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('myChannel');
        expect(response.body.myChannel).toHaveProperty('id');
        expect(response.body.myChannel).toHaveProperty('title');
        expect(response.body.myChannel).toHaveProperty('headCount');
        expect(response.body.myChannel).toHaveProperty('maxCount');
      });
    });

    describe('GET /channels/{roomId}/chats?offset={offset}&count={count}', () => {
      it('[Valid Case] 채팅 내역 없는 경우', async () => {
        const user: UserModel = await channelData.createUserInChannel(9);
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'GET',
          `/channels/${user.joinedChannel}/chats?count=10&offset=0`,
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('chats');
        expect(response.body.chats.length).toBe(0);
      });

      it('[Valid Case] 채팅 내역 조회 (last Page true)', async () => {
        const channel: ChannelModel =
          await channelData.createChannelWithNormalChats(10);
        const user: UserModel = userFactory.findById(channel.ownerId);
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'GET',
          `/channels/${user.joinedChannel}/chats?count=10&offset=0`,
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('chats');
        for (const c of response.body.chats) {
          expect(c).toHaveProperty('id');
          expect(c).toHaveProperty('nickname');
          expect(c).toHaveProperty('message');
          expect(c).toHaveProperty('time');
          expect(c).toHaveProperty('type');
        }
        expect(response.body.chats.length).toBe(10);
        expect(response.body.isLastPage).toBe(true);
      });

      it('[Valid Case] 채팅 내역 조회 (last Page false)', async () => {
        const channel: ChannelModel =
          await channelData.createChannelWithNormalChats(100);
        const user: UserModel = userFactory.findById(channel.ownerId);
        const token: string = await userData.giveTokenToUser(user);

        const response = await req(
          token,
          'GET',
          `/channels/${user.joinedChannel}/chats?count=10&offset=0`,
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('chats');
        for (const c of response.body.chats) {
          expect(c).toHaveProperty('id');
          expect(c).toHaveProperty('nickname');
          expect(c).toHaveProperty('message');
          expect(c).toHaveProperty('time');
          expect(c).toHaveProperty('type');
        }
        expect(response.body.chats.length).toBe(10);
        expect(response.body.isLastPage).toBe(false);
      });
    });

    describe('DELETE /channels/{roomId}/invitation', () => {
      it('[Valid Case] 채널 초대 목록에서 삭제 성공', async () => {
        const user = await channelData.createInvitePendingUser(10);
        const token = await userData.giveTokenToUser(user);
        const inviteIterator = user.inviteList.values();
        inviteIterator.next();
        const invite = inviteIterator.next().value;
        const response = await req(
          token,
          'DELETE',
          `/channels/${invite.id}/invitation`,
        );
        expect(response.status).toBe(200);
      });

      it('[Valid Case] 채널 초대 목록에서 삭제 씹기(없는초대)', async () => {
        const user = await channelData.createInvitePendingUser(10);
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/channels/invalidid/invitation`,
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
