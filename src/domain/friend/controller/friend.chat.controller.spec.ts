import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { FriendDirectMessageTestService } from 'src/domain/direct-message-room/test/direct-message-room.test.service';
import { AppModule } from '../../../app.module';

describe('FriendController - Chat', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let testService: FriendDirectMessageTestService;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    testService = module.get<FriendDirectMessageTestService>(
      FriendDirectMessageTestService,
    );
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    await testService.createProfileImages();
    await testService.createBasicUsers(100);
    await testService.createUserFriends(10);
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
    await app.close();
  });

  afterEach(async () => {
    testService.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  describe('[GET]', () => {
    describe('/users/friends/{nickname}/chats', () => {
      it('DM 대화 내역 정상 조회', async () => {
        const user = testService.users[0];
        const sender = testService.users[1];
        await testService.createDirectMessageToUser0(30);
        const token = await testService.giveTokenToUser(user);
        const count = 20;
        const offset = 0;
        let response = await req(
          token,
          'GET',
          `/users/friends/${sender.nickname}/chats?count=${count}&offset=${offset}`,
        );
        let result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chatList');
        expect(result.chatList).toBe(20);
        expect(result).toHaveProperty('isLastPage');
        expect(result.isLastPage).toBe(false);
        for (const chat of result.chatList) {
          expect(chat).toHaveProperty('id');
          expect(chat).toHaveProperty('message');
          expect(chat).toHaveProperty('nickname');
          expect(chat.nickname).toBe(sender.nickname);
          expect(chat).toHaveProperty('createdAt');
        }

        response = await req(
          token,
          'GET',
          `/users/friends/${sender.nickname}/chats?count=${count}&offset=${
            result.chatList[result.chatList.length - 1].id
          }`,
        );
        result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chatList');
        expect(result.chatList).toBe(10);
        expect(result).toHaveProperty('isLastPage');
        expect(result.isLastPage).toBe(true);
        for (const chat of result.chatList) {
          expect(chat).toHaveProperty('id');
          expect(chat).toHaveProperty('message');
          expect(chat).toHaveProperty('nickname');
          expect(chat.nickname).toBe(sender.nickname);
          expect(chat).toHaveProperty('createdAt');
        }
      });

      it('DM 대화 내역 빈 경우', async () => {
        const user = testService.users[0];
        const sender = testService.users[1];
        const token = await testService.giveTokenToUser(user);
        const count = 20;
        const offset = 0;
        const response = await req(
          token,
          'GET',
          `/users/friends/${sender.nickname}/chats?count=${count}&offset=${offset}`,
        );
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chatList');
        expect(result.chatList).toBe(0);
        expect(result).toHaveProperty('isLastPage');
        expect(result.isLastPage).toBe(true);
      });

      it('DM 대화 내역 조회 실패(없는 유저)', async () => {
        const user = testService.users[1];
        const nobody = 'nobody';
        const token = await testService.giveTokenToUser(user);
        const count = 20;
        const offset = 0;
        const response = await req(
          token,
          'GET',
          `/users/friends/${nobody}/chats?count=${count}&offset=${offset}`,
        );
        expect(response.status).toBe(400);
      });
    });

    describe('/users/friends/chatlist', () => {
      it('진행 중인 DM 목록 정상 조회', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        await testService.createDirectMessageToUser0(30);
        await testService.createAllReadDirectMessageRoomToUserI(1);
        await testService.createHalfReadDirectMessageRoomToUserI(2);
        await testService.createDirectMessageRoomToUserI(3);
        await testService.createAllReadDirectMessageRoomToUserI(4);
        await testService.createHalfReadDirectMessageRoomToUserI(5);
        await testService.createDirectMessageRoomToUserI(6);
        const response = await req(token, 'GET', `/users/friends/chatlist`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('dmList');
        expect(result.dmList.length).toBe(6);
        for (const dm of result.dmList) {
          expect(dm).toHaveProperty('imgUrl');
          expect(dm).toHaveProperty('nickname');
          expect(dm).toHaveProperty('newChats');
        }
      });
      it('진행 중인 DM 목록 빈 경우', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        const response = await req(token, 'GET', `/users/friends/chatlist`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('dmList');
        expect(result.dmList).toBe(0);
      });
    });

    describe('/users/friends/chats/new', () => {
      it('새로운 DM이 있는 경우', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        await testService.createDirectMessageToUser0(30);
        await testService.createHalfReadDirectMessageRoomToUserI(2);
        const response = await req(token, 'GET', `/users/friends/chats/new`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('hasNewChat');
        expect(result.hasNewChat).toBe(true);
      });
      it('새로운 DM이 없는 경우', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        await testService.createDirectMessageRoomToUserI(2);
        const response = await req(token, 'GET', `/users/friends/chats/new`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('hasNewChat');
        expect(result.hasNewChat).toBe(false);
      });
    });
  });

  describe('[POST]', () => {
    describe('/users/friends/{nickname}/chats', () => {
      it('DM 전송 정상 요청', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        const receiver = testService.users[1];
        const body = {
          message: 'hello',
        };
        const response = await req(
          token,
          'POST',
          `/users/friends/${receiver.nickname}/chats`,
          body,
        );
        expect(response.status).toBe(200);
      });
      it('DM 전송 실패 요청(안친구)', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        const receiver = testService.users[77];
        const body = {
          message: 'hello',
        };
        const response = await req(
          token,
          'POST',
          `/users/friends/${receiver.nickname}/chats`,
          body,
        );
        expect(response.status).toBe(400);
      });
      it('DM 전송 실패 요청(없는사람)', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        const receiver = 'nobody';
        const body = {
          message: 'hello',
        };
        const response = await req(
          token,
          'POST',
          `/users/friends/${receiver}/chats`,
          body,
        );
        expect(response.status).toBe(400);
      });
    });
  });

  describe('[DELETE]', () => {
    describe('/users/friends/chats/{nickname}', () => {
      it('DM 리스트에서 방 삭제 정상 요청', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        await testService.createDirectMessageToUser0(30);
        const deleted = testService.users[1];
        await testService.createAllReadDirectMessageRoomToUserI(deleted.id);
        const response = await req(
          token,
          'DELETE',
          `/users/friends/chats/${deleted.nickname}`,
        );
        expect(response.status).toBe(200);
      });
      it('DM 리스트에서 방 삭제 실패 요청(없는방)', async () => {
        const user = testService.users[0];
        const token = await testService.giveTokenToUser(user);
        await testService.createDirectMessageToUser0(30);
        const nobangUser = testService.users[2];
        const response = await req(
          token,
          'DELETE',
          `/users/friends/chats/${nobangUser.nickname}`,
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
