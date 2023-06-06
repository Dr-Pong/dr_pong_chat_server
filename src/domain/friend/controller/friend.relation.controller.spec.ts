import { Test, TestingModule } from '@nestjs/testing';
import { FriendController } from './friend.controller';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { FriendTestService } from 'src/domain/friend/test/friend.test.service';
import { FriendService } from 'src/domain/friend/friend.service';
import { initializeTransactionalContext } from 'typeorm-transactional';

describe('FriendController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let friendTestService: FriendTestService;
  let friendService: FriendService;
  initializeTransactionalContext();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendController],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    friendTestService = module.get<FriendTestService>(FriendTestService);
    friendService = module.get<FriendService>(FriendService);
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    await friendTestService.createProfileImages();
    await friendTestService.createBasicUsers(100);
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
    await app.close();
  });

  afterEach(async () => {
    friendTestService.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  afterEach(async () => {
    friendTestService.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  describe('[GET]', () => {
    describe('/users/friends', () => {
      it('친구 목록 정상 조회', async () => {
        await friendTestService.createUserFriends(50);
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(token, 'GET', '/users/friends');
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('users');
        expect(result.users.length).toBe(49);
        for (const user of response.body.users) {
          expect(user).toHaveProperty('nickname');
          expect(user).toHaveProperty('imgUrl');
        }
        expect(result.users.flatMap((user) => user.nickname)).toEqual(
          result.users.sort((a, b) => a.nickname.localeCompare(b.nickname)),
        );
      });
    });

    describe('/users/friends/pendings', () => {
      it('친구 요청 목록 정상 조회', async () => {
        await friendTestService.createUserRequesting(50);
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(token, 'GET', `/users/friends/pendings`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('users');
        expect(result.users.length).toBe(49);
        for (const user of result.users) {
          expect(user).toHaveProperty('nickname');
          expect(user).toHaveProperty('imgUrl');
        }
        expect(result.users.flatMap((user) => user.nickname)).toEqual(
          result.users.sort((a, b) => a.nickname.localeCompare(b.nickname)),
        );
      });
    });
  });

  describe('[POST]', () => {
    describe('/users/friends/pendings/{nickname}', () => {
      it('친구 요청 정상 전송', async () => {
        const user = friendTestService.users[0];
        const receiver = friendTestService.users[1];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/friends/pendings/${receiver.nickname}`,
        );
        expect(response.status).toBe(200);
      });
    });

    describe('/users/friends/{nickname}', () => {
      it('친구 요청 정상 수락', async () => {
        const user = friendTestService.users[0];
        const sender = friendTestService.users[1];
        await friendTestService.createUser0ToRequesting(sender.id);
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/friends/${sender.nickname}`,
        );
        expect(response.status).toBe(200);
      });
    });
  });

  describe('[DELETE]', () => {
    describe('/users/friends/pendings/{nickname}', () => {
      it('친구 요청 정상 거절', async () => {
        const user = friendTestService.users[0];
        const sender = friendTestService.users[1];
        await friendTestService.createUser0ToRequesting(sender.id);
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/friends/pendings/${sender.nickname}`,
        );
        expect(response.status).toBe(200);
      });
    });

    describe('/users/friends/{nickname}', () => {
      it('친구 정상 삭제', async () => {
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        await friendTestService.createUser0ToFriends(friend.id);
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/friends/${friend.nickname}`,
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
