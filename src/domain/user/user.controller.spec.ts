import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserTestService } from './test/user.test.service';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';
import { User } from './user.entity';
import {
  RELATION_BLOCKED,
  RELATION_FRIEND,
  RELATION_NONE,
} from 'src/global/type/type.user.relation';
import { UserTestModule } from './test/user.test.module';

describe('UserController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let testData: UserTestService;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, UserTestModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    testData = module.get<UserTestService>(UserTestService);
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    await testData.createProfileImages();
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
    await app.close();
  });

  afterEach(async () => {
    testData.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  describe('GET /users/{nickname}/relations/{targetnickname}', () => {
    it('[Valid Case] friend인 경우', async () => {
      const user: User = await testData.createBasicUser('user1');
      const targetUser: User = await testData.createBasicUser('user2');
      await testData.makeFriend(user, targetUser);

      const res = await req(
        null,
        'GET',
        `/users/${user.nickname}/relations/${targetUser.nickname}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe(RELATION_FRIEND);
    });

    it('[Valid Case] block인 경우', async () => {
      const user: User = await testData.createBasicUser('user1');
      const targetUser: User = await testData.createBasicUser('user2');
      await testData.makeBlock(user, targetUser);

      const res = await req(
        null,
        'GET',
        `/users/${user.nickname}/relations/${targetUser.nickname}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe(RELATION_BLOCKED);
    });

    it('[Valid Case] none인 경우', async () => {
      const user: User = await testData.createBasicUser('user1');
      const targetUser: User = await testData.createBasicUser('user2');

      const res = await req(
        null,
        'GET',
        `/users/${user.nickname}/relations/${targetUser.nickname}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe(RELATION_NONE);
    });

    it('[Error Case] target이 없는 유저인 경우', async () => {
      const user: User = await testData.createBasicUser('user1');

      const res = await req(
        null,
        'GET',
        `/users/${user.nickname}/relations/none`,
      );
      expect(res.status).toBe(400);
    });

    it('[Error Case] user가 없는 유저인 경우', async () => {
      const user: User = await testData.createBasicUser('user1');

      const res = await req(
        null,
        'GET',
        `/users/none/relations/${user.nickname}`,
      );
      expect(res.status).toBe(400);
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
