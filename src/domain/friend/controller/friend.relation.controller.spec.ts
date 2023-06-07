import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { FriendTestService } from 'src/domain/friend/test/friend.test.service';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from 'src/app.module';

describe('FriendController - Relation', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let friendTestService: FriendTestService;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    friendTestService = module.get<FriendTestService>(FriendTestService);
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

  describe('[GET]', () => {
    describe('/users/friends', () => {
      it('친구 목록 조회', async () => {
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
        expect(result.users).toEqual(
          result.users.sort((a, b) => a.nickname.localeCompare(b.nickname)),
        );
      });
      it('친구 목록 조회(나는 친구가 없다)', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(token, 'GET', '/users/friends');
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('users');
        expect(result.users.length).toBe(0);
      });
    });

    describe('/users/friends/pendings', () => {
      it('친구 요청 목록 조회', async () => {
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
        expect(result.users).toEqual(
          result.users.sort((a, b) => a.nickname.localeCompare(b.nickname)),
        );
      });
      it('친구 요청 목록 조회(나와 친구가 되려는 이가 없다)', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(token, 'GET', `/users/friends/pendings`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('users');
        expect(result.users.length).toBe(0);
      });
    });
  });

  describe('[POST]', () => {
    describe('/users/friends/pendings/{nickname}', () => {
      it('친구 요청 성공', async () => {
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
      it('친구 요청 실패(없는 아이디)', async () => {
        const user = friendTestService.users[0];
        const receiver = 'nobody';
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/friends/pendings/${receiver}`,
        );
        expect(response.status).toBe(400);
      });
      it('친구 요청 실패(이미 친구)', async () => {
        const user = friendTestService.users[0];
        const receiver = friendTestService.users[1];
        await friendTestService.createUser0ToFriends(receiver.id);
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/friends/pendings/${receiver.nickname}`,
        );
        expect(response.status).toBe(400);
      });
    });

    describe('/users/friends/{nickname}', () => {
      it('친구 요청 수락 성공', async () => {
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
      it('친구 요청 수락 실패(이미 친구)', async () => {
        const user = friendTestService.users[0];
        const alreadyFriend = friendTestService.users[1];
        await friendTestService.createUser0ToRequesting(alreadyFriend.id);
        await friendTestService.createUser0ToFriends(alreadyFriend.id);
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/friends/${alreadyFriend.nickname}`,
        );
        expect(response.status).toBe(400);
      });
      it('친구 요청 수락 실패(없는 아이디)', async () => {
        const user = friendTestService.users[0];
        const nobody = 'nobody';
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(token, 'POST', `/users/friends/${nobody}`);
        expect(response.status).toBe(400);
      });
      it('친구 요청 수락 실패(아이디는 있는데 요청이 없음)', async () => {
        const user = friendTestService.users[0];
        const notSender = friendTestService.users[15];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/friends/${notSender.nickname}`,
        );
        expect(response.status).toBe(400);
      });
    });
  });

  describe('[DELETE]', () => {
    describe('/users/friends/pendings/{nickname}', () => {
      it('친구 요청 거절 성공', async () => {
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
      it('친구 요청 거절 실패(없는 아이디)', async () => {
        const user = friendTestService.users[0];
        const nobody = 'nobody';
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/friends/pendings/${nobody}`,
        );
        expect(response.status).toBe(400);
      });
      it('친구 요청 거절 실패(없는 요청)', async () => {
        const user = friendTestService.users[0];
        const noRequest = friendTestService.users[12];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/friends/pendings/${noRequest.nickname}`,
        );
        expect(response.status).toBe(400);
      });
    });

    describe('/users/friends/{nickname}', () => {
      it('친구 삭제 성공', async () => {
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
      it('친구 삭제 실패(없는 아이디)', async () => {
        const user = friendTestService.users[0];
        const nobody = 'nobody';
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(token, 'DELETE', `/users/friends/${nobody}`);
        expect(response.status).toBe(400);
      });
      it('친구 삭제 실패(친구 아님)', async () => {
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/friends/${friend.nickname}`,
        );
        expect(response.status).toBe(400);
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