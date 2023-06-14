import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from '../../../app.module';
import { FriendTestData } from '../../data/friend.test.data';
import { TestDataModule } from 'src/test/data/test.data.module';
import { UserTestData } from 'src/test/data/user.test.data';
import { ChannelTestData } from '../../data/channel.test.data';
import {UserFactory} from "../../../domain/factory/user.factory";
import {ChannelFactory} from "../../../domain/factory/channel.factory";

describe('Notification Controller', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let userData: UserTestData;
  let friendData: FriendTestData;
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
    friendData = module.get<FriendTestData>(FriendTestData);
    channelData = module.get<ChannelTestData>(ChannelTestData);
    userFactory = module.get<UserFactory>(UserFactory);
    channelFactory = module.get<ChannelFactory>(ChannelFactory);
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    await userData.createBasicUsers(100);
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
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
    describe('/users/notifications/friends', () => {
      it('친구 요청 개수 조회 성공(나와친구가되려는이50이상)', async () => {
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        for (let i = 1; i <= 99; i++) {
          await friendData.createFriendRequestFromTo(userData.users[i], user);
        }
        const response = await req(
          token,
          'GET',
          '/users/notifications/friends',
        );
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('requestCount');
        expect(response.body.requestCount).toBe(50);
      });
      it('친구 요청 개수 조회 성공(나와친구가되려는이50이하)', async () => {
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        for (let i = 1; i <= 25; i++) {
          await friendData.createFriendRequestFromTo(userData.users[i], user);
        }
        const response = await req(
          token,
          'GET',
          '/users/notifications/friends',
        );
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('requestCount');
        expect(response.body.requestCount).toBe(25);
      });
      it('친구 요청 개수 조회 성공(나와친구가되려는이없다)', async () => {
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'GET',
          '/users/notifications/friends',
        );
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('requestCount');
        expect(response.body.requestCount).toBe(0);
      });
    });

    describe('/users/notifications/channels', () => {
      it('채널 초대 목록 조회 성공(있음)', async () => {
        const user = await channelData.createInvitePendingUser(33);
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'GET',
          '/users/notifications/channels',
        );
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('invitations');
        expect(response.body.invitations.length).toBe(33);
        for (const invitation of response.body.invitations) {
          expect(invitation).toHaveProperty('id');
          expect(invitation).toHaveProperty('channelId');
          expect(invitation).toHaveProperty('channelName');
          expect(invitation).toHaveProperty('from');
          expect(invitation).toHaveProperty('createdAt');
        }
      });
      it('채널 초대 목록 조회 성공(없음)', async () => {
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'GET',
          '/users/notifications/channels',
        );
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('invitations');
        expect(response.body.invitations.length).toBe(0);
      });
    });
  });

  describe('[DELETE]', () => {
    describe('/users/notifications/channels/{id}', () => {
      it('채널 초대 목록에서 삭제 성공', async () => {
        const user = await channelData.createInvitePendingUser(10);
        const token = await userData.giveTokenToUser(user);
        const inviteIterator = user.inviteList.values();
        inviteIterator.next();
        const invite = inviteIterator.next().value;
        const response = await req(
          token,
          'DELETE',
          `/users/notifications/channels/${invite.id}`,
        );
        expect(response.status).toBe(200);
      });
      it('채널 초대 목록에서 삭제 씹기(없는초대)', async () => {
        const user = await channelData.createInvitePendingUser(10);
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/notifications/channels/noid`,
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
