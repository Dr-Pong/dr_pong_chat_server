import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlockTestData } from '../../data/block.test.data';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from '../../../app.module';
import * as request from 'supertest';
import { TestDataModule } from 'src/test/data/test.data.module';
import { UserTestData } from 'src/test/data/user.test.data';
import { User } from 'src/domain/user/user.entity';

describe('BlockController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let blockData: BlockTestData;
  let userData: UserTestData;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestDataModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    blockData = module.get<BlockTestData>(BlockTestData);
    userData = module.get<UserTestData>(UserTestData);
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
    await app.close();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    userData.clear();
    await dataSources.synchronize(true);
  });

  describe('[GET]', () => {
    describe('users/blocks', () => {
      it('[ValidCase] 차단목록 조회', async () => {
        const user: User = await userData.createUser('user');
        const target1: User = await userData.createUser('target1');
        const target2: User = await userData.createUser('target2');
        await blockData.blockUser(user, target1);
        await blockData.blockUser(user, target2);
        const token = await userData.giveTokenToUser(user);
        const response = await req(token, 'GET', `/users/blocks`);
        const result = response.body;

        expect(response.status).toBe(200);
        expect(result).toHaveProperty('users');
        expect(result.users[0]).toHaveProperty('nickname');
        expect(result.users[0]).toHaveProperty('imgUrl');
        expect(result.users[1]).toHaveProperty('nickname');
        expect(result.users[1]).toHaveProperty('imgUrl');
        expect(result.users.length).toBe(2);
      });

      it('[ValidCase] 차단목록이 빈경우', async () => {
        const user: User = await userData.createUser('user');
        const token = await userData.giveTokenToUser(user);
        const response = await req(token, 'GET', `/users/blocks`);
        const result = response.body;

        expect(response.status).toBe(200);
        expect(result).toHaveProperty('users');

        expect(result.users.length).toBe(0);
      });
    });
  });
  describe('[POST]', () => {
    describe('/users/blocks/{nickname}', () => {
      it('[ValidCase] 차단 추가할때', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/blocks/${target.nickname}`,
        );

        expect(response.status).toBe(201);
      });

      it('[ValidCase] 이미 차단된 사용자', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        await blockData.blockUser(user, target);
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/blocks/${target.nickname}`,
        );

        expect(response.status).toBe(201);
      });

      it('[InvalidCase] 차단할 사용자가 없는 경우', async () => {
        const user: User = await userData.createUser('user');
        const target = 'invalidNicknameLikeLoveMeLikeThisLoveMeLikeThat';
        const token = await userData.giveTokenToUser(user);
        const response = await req(token, 'POST', `/users/blocks/${target}`);

        expect(response.status).toBe(400);
      });
    });
  });
  describe('[DELETE]', () => {
    describe('/users/blocks/{nickname}', () => {
      it('[ValidCase] 차단이 해제되는지', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        await blockData.blockUser(user, target);
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/blocks/${target.nickname}`,
        );

        expect(response.status).toBe(200);
      });

      it('[InvalidCase] 차단 목록에 없는 유저를 해제하려할때 에러응답', async () => {
        const user: User = await userData.createUser('user');
        const target: User = await userData.createUser('target');
        const token = await userData.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/blocks/${target.nickname}`,
        );

        expect(response.status).toBe(400);
      });

      it('[InvalidCase] 차단 해제할 사용자가 없는 경우', async () => {
        const user: User = await userData.createUser('user');
        const target = 'invalidNicknameLikeLoveMeLikeThisLoveMeLikeThat';
        const token = await userData.giveTokenToUser(user);
        const response = await req(token, 'DELETE', `/users/blocks/${target}`);

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
