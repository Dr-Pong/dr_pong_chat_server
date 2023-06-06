import { Test, TestingModule } from '@nestjs/testing';
import { FriendController } from './friend.controller';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { FriendTestService } from 'src/domain/friend/test/friend.test.service';
import { FriendService } from 'src/domain/friend/friend.service';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { TestService } from 'src/domain/channel-user/test/test.service';
import { DirectMessageTestService } from 'src/domain/direct-message/test/direct-message.test.service';
import { FriendDirectMessageTestService } from 'src/domain/direct-message-room/test/direct-message-room.test.service';

describe('FriendController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let friendTestService: FriendTestService;
  let channelUserTestService: TestService;
  let directMessageTestService: DirectMessageTestService;
  let directMessageRoomTestService: FriendDirectMessageTestService;
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
    channelUserTestService = module.get<TestService>(TestService);
    directMessageTestService = module.get<DirectMessageTestService>(
      DirectMessageTestService,
    );
    directMessageRoomTestService = module.get<FriendDirectMessageTestService>(
      FriendDirectMessageTestService,
    );
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
    //친구 목록 조회
    describe('/users/friends', () => {
      it('친구 목록 정상 조회', async () => {
        await friendTestService.createUserFriends(50);
        const response = await request(app.getHttpServer()).get(
          '/users/friends',
        );
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

    //친구 요청 목록 조회
    describe('/users/friends/pendings', () => {
      it('some test', async () => {});
    });

    describe('/users/friends/{nickname}/chats', () => {
      it('some test', async () => {});
    });

    describe('/users/friends/chatlist', () => {
      it('some test', async () => {});
    });

    describe('/users/friends/chats/new', () => {
      it('some test', async () => {});
    });
  });

  describe('[POST]', () => {
    describe('/users/friends/{nickname}', () => {
      it('some test', async () => {});
    });

    describe('/users/friends/{nickname}/chats', () => {
      it('some test', async () => {});
    });
  });

  describe('[DELETE]', () => {
    describe('/users/friends/pendings/{nickname}', () => {
      it('some test', async () => {});
    });

    describe('/users/friends/{nickname}', () => {
      it('some test', async () => {});
    });

    describe('/users/friends/chats/{nickname}', () => {
      it('some test', async () => {});
    });
  });
});
