import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { DirectMessageRoomTestData } from 'src/test/data/direct-message-room.test.data';
import { AppModule } from '../../../app.module';
import { FriendTestData } from '../../data/friend.test.data';
import { DirectMessageTestData } from '../../data/direct-message.test.data';
import { TestDataModule } from 'src/test/data/test.data.module';
import { UserTestData } from 'src/test/data/user.test.data';

describe('FriendController - Chat', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let userData: UserTestData;
  let friendData: FriendTestData;
  let directMessageData: DirectMessageTestData;
  let directMessageRoomData: DirectMessageRoomTestData;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestDataModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    userData = module.get<UserTestData>(UserTestData);
    friendData = module.get<FriendTestData>(FriendTestData);
    directMessageData = module.get<DirectMessageTestData>(
      DirectMessageTestData,
    );
    directMessageRoomData = module.get<DirectMessageRoomTestData>(
      DirectMessageRoomTestData,
    );
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    await userData.createBasicUsers(100);
    for (let i = 1; i <= 10; i++) {
      await friendData.makeFriend(userData.users[0], userData.users[i]);
    }
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
    await app.close();
  });

  afterEach(async () => {
    userData.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  describe('[GET]', () => {
    describe('/users/friends/{nickname}/chats', () => {
      it('DM 대화 내역 조회', async () => {
        const user = userData.users[0];
        const sender = userData.users[1];
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(sender, user);
        }
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(user, sender);
        }
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(sender, user);
        }
        const token = await userData.giveTokenToUser(user);
        const count = 20;
        const offset = 2147483647;
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
        expect(result.chats).toEqual(result.chats.sort((a, b) => b.id - a.id));

        const secondOffset = result.chats[result.chats.length - 1].id;
        response = await req(
          token,
          'GET',
          `/users/friends/${sender.nickname}/chats?count=${count}&offset=${secondOffset}`,
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
        expect(result.chats[0].id).toBeLessThan(secondOffset);
        expect(result.chats).toEqual(result.chats.sort((a, b) => b.id - a.id));
      });

      it('DM 대화 내역 빈 경우', async () => {
        const user = userData.users[0];
        const sender = userData.users[1];
        const token = await userData.giveTokenToUser(user);
        const count = 20;
        const offset = 2147483647;
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
        const user = userData.users[0];
        const nobody = 'nobody';
        const token = await userData.giveTokenToUser(user);
        const count = 20;
        const offset = 2147483647;
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
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        await directMessageRoomData.createEmptyDirectMessageRoom(
          user,
          userData.users[1],
        );
        await directMessageRoomData.createEmptyDirectMessageRoom(
          user,
          userData.users[2],
        );
        await directMessageRoomData.createEmptyDirectMessageRoom(
          user,
          userData.users[3],
        );
        await directMessageRoomData.createEmptyDirectMessageRoom(
          user,
          userData.users[4],
        );
        await directMessageRoomData.createEmptyDirectMessageRoom(
          user,
          userData.users[5],
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
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const response = await req(token, 'GET', `/users/friends/chatlist`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('chatList');
        expect(result.chatList.length).toBe(0);
      });
    });

    describe('/users/friends/chats/new', () => {
      it('새로운 DM이 있는 경우', async () => {
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const friend = userData.users[1];
        await directMessageRoomData.createEmptyDirectMessageRoom(user, friend);
        await directMessageData.createDirectMessageFromTo(friend, user);
        const response = await req(token, 'GET', `/users/friends/chats/new`);
        const result = response.body;
        expect(response.status).toBe(200);
        expect(result).toHaveProperty('hasNewChat');
        expect(result.hasNewChat).toBe(true);
      });
      it('새로운 DM이 없는 경우', async () => {
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const friend = userData.users[1];
        await directMessageData.createDirectMessageFromTo(friend, user);
        await directMessageRoomData.createAllReadDirectMessageRoom(
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
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const receiver = userData.users[1];
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
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const receiver = userData.users[77];
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
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
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
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const deleted = userData.users[1];
        for (let i = 0; i < 30; i++) {
          await directMessageData.createDirectMessageFromTo(deleted, user);
        }
        await directMessageRoomData.createHalfReadDirectMessageRoom(
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
        const user = userData.users[0];
        const token = await userData.giveTokenToUser(user);
        const nobangUser = userData.users[2];
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
