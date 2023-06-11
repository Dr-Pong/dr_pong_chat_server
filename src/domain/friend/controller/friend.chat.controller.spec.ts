import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { DirectMessageRoomTestService } from 'src/domain/direct-message-room/test/direct-message-room.test.service';
import { AppModule } from '../../../app.module';
import { FriendTestService } from '../test/friend.test.service';
import { DirectMessageTestService } from '../../direct-message/test/direct-message.test.service';

describe('FriendController - Chat', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let friendTestService: FriendTestService;
  let directMessageTestService: DirectMessageTestService;
  let directMessageRoomTestService: DirectMessageRoomTestService;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    friendTestService = module.get<FriendTestService>(FriendTestService);
    directMessageTestService = module.get<DirectMessageTestService>(
      DirectMessageTestService,
    );
    directMessageRoomTestService = module.get<DirectMessageRoomTestService>(
      DirectMessageRoomTestService,
    );
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    await friendTestService.createProfileImages();
    await friendTestService.createBasicUsers(100);
    for (let i = 1; i <= 10; i++) {
      await friendTestService.makeFriend(
        friendTestService.users[0],
        friendTestService.users[i],
      );
    }
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
    await app.close();
  });

  afterEach(async () => {
    friendTestService.clear();
    directMessageTestService.clear();
    directMessageRoomTestService.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  describe('[GET]', () => {
    describe('/users/friends/{nickname}/chats', () => {
      it('DM 대화 내역 조회', async () => {
        const user = friendTestService.users[0];
        const sender = friendTestService.users[1];
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            sender,
            user,
          );
        }
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            sender,
          );
        }
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            sender,
            user,
          );
        }
        const token = await friendTestService.giveTokenToUser(user);
        const count = 20;
        const offset = 0;
        let response = await req(
          token,
          'GET',
          `/users/friends/${sender.nickname}/chats?count=${count}&offset=${offset}`,
        );
        let result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chats');
        expect(result.chats.length).toBe(20);
        expect(result).toHaveProperty('isLastPage');
        expect(result.isLastPage).toBe(false);
        for (const chat of result.chats) {
          expect(chat).toHaveProperty('id');
          expect(chat).toHaveProperty('message');
          expect(chat).toHaveProperty('nickname');
          expect(chat).toHaveProperty('time');
          expect(chat).toHaveProperty('type');
          if (chat.type === 'me') {
            expect(chat.nickname).toBe(user.nickname);
          } else if (chat.type === 'others') {
            expect(chat.nickname).toBe(sender.nickname);
          }
          expect(chat).toHaveProperty('time');
        }

        response = await req(
          token,
          'GET',
          `/users/friends/${sender.nickname}/chats?count=${count}&offset=${
            result.chats[result.chats.length - 1].id
          }`,
        );
        result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chats');
        expect(result.chats.length).toBe(10);
        expect(result).toHaveProperty('isLastPage');
        expect(result.isLastPage).toBe(true);
        for (const chat of result.chats) {
          expect(chat).toHaveProperty('id');
          expect(chat).toHaveProperty('message');
          expect(chat).toHaveProperty('nickname');
          expect(chat).toHaveProperty('time');
          expect(chat).toHaveProperty('type');
          if (chat.type === 'me') {
            expect(chat.nickname).toBe(user.nickname);
          } else if (chat.type === 'others') {
            expect(chat.nickname).toBe(sender.nickname);
          }
          expect(chat).toHaveProperty('time');
        }
      });

      it('DM 대화 내역 빈 경우', async () => {
        const user = friendTestService.users[0];
        const sender = friendTestService.users[1];
        const token = await friendTestService.giveTokenToUser(user);
        const count = 20;
        const offset = 0;
        const response = await req(
          token,
          'GET',
          `/users/friends/${sender.nickname}/chats?count=${count}&offset=${offset}`,
        );
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chats');
        expect(result.chats.length).toBe(0);
        expect(result).toHaveProperty('isLastPage');
        expect(result.isLastPage).toBe(true);
      });

      it('DM 대화 내역 조회 실패(없는 유저)', async () => {
        const user = friendTestService.users[0];
        const nobody = 'nobody';
        const token = await friendTestService.giveTokenToUser(user);
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
      it('진행 중인 DM 목록 조회', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friendTestService.users[1],
        );
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friendTestService.users[2],
        );
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friendTestService.users[3],
        );
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friendTestService.users[4],
        );
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friendTestService.users[5],
        );
        const response = await req(token, 'GET', `/users/friends/chatlist`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chatList');
        expect(result.chatList.length).toBe(5);
        for (const dm of result.chatList) {
          expect(dm).toHaveProperty('imgUrl');
          expect(dm).toHaveProperty('nickname');
          expect(dm).toHaveProperty('newChats');
        }
      });
      it('진행 중인 DM 목록 빈 경우', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const response = await req(token, 'GET', `/users/friends/chatlist`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chatList');
        expect(result.chatList.length).toBe(0);
      });
    });

    describe('/users/friends/chats/new', () => {
      it('새로운 DM이 있는 경우', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const friend = friendTestService.users[1];
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friend,
        );
        await directMessageTestService.createDirectMessageFromTo(friend, user);
        const response = await req(token, 'GET', `/users/friends/chats/new`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('hasNewChat');
        expect(result.hasNewChat).toBe(true);
      });
      it('새로운 DM이 없는 경우', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const friend = friendTestService.users[1];
        await directMessageTestService.createDirectMessageFromTo(friend, user);
        await directMessageRoomTestService.createAllReadDirectMessageRoom(
          user,
          friend,
        );
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
      it('DM 전송 성공', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const receiver = friendTestService.users[1];
        const body = {
          message: 'hello',
        };
        const response = await req(
          token,
          'POST',
          `/users/friends/${receiver.nickname}/chats`,
          body,
        );
        expect(response.status).toBe(201);
      });
      it('DM 전송 실패(안친구)', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const receiver = friendTestService.users[77];
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
      it('DM 전송 실패(없는사람)', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
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
      it('DM 리스트에서 방 삭제 성공', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const deleted = friendTestService.users[1];
        for (let i = 0; i < 30; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            deleted,
            user,
          );
        }
        await directMessageRoomTestService.createHalfReadDirectMessageRoom(
          user,
          deleted,
        );
        const response = await req(
          token,
          'DELETE',
          `/users/friends/chats/${deleted.nickname}`,
        );
        expect(response.status).toBe(200);
      });
      it('DM 리스트에서 방 삭제 실패(없는방)', async () => {
        const user = friendTestService.users[0];
        const token = await friendTestService.giveTokenToUser(user);
        const nobangUser = friendTestService.users[2];
        const response = await req(
          token,
          'DELETE',
          `/users/friends/chats/${nobangUser.nickname}`,
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
