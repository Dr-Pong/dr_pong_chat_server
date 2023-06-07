import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlockTestService } from '../test/block.test.service';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from '../../../app.module';
import { UserModel } from 'src/domain/factory/model/user.model';
import * as request from 'supertest';

describe('BlockController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let testData: BlockTestService;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    testData = module.get<BlockTestService>(BlockTestService);
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
    await dataSources.synchronize(true);
  });
  describe('[GET]', () => {
    describe('/blocks', () => {
      it('[ValidCase] 차단목록 조회', async () => {
        const user: UserModel = await testData.createBasicUser('user');
        const target1: UserModel = await testData.createBasicUser('target1');
        const target2: UserModel = await testData.createBasicUser('target2');
        await testData.createUserBlocks(user, target1);
        await testData.createUserBlocks(user, target2);
        const token = await testData.giveTokenToUser(user);
        const response = await req(token, 'GET', `/blocks`);
        const result = response.body;

        expect(response.status).toBe(200);
        expect(result).toHaveProperty('users');
        expect(result.users).toHaveProperty('nickname');
        expect(result.users).toHaveProperty('imgUrl');

        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: target1.id,
              nickname: target1.nickname,
              imageUrl: target1.profileImage,
            }),
            expect.objectContaining({
              id: target2.id,
              nickname: target2.nickname,
              imageUrl: target2.profileImage,
            }),
          ]),
        );
        expect(result.length).toBe(2);
      });

      it('[ValidCase] 차단목록이 빈경우', async () => {
        const user: UserModel = await testData.createBasicUser('user');
        const token = await testData.giveTokenToUser(user);
        const response = await req(token, 'GET', `/blocks`);
        const result = response.body;

        expect(response.status).toBe(200);
        expect(result).toHaveProperty('users');
        expect(result.users).toHaveProperty('nickname');
        expect(result.users).toHaveProperty('imgUrl');

        expect(result).toEqual([]);
      });
    });
  });
  describe('[POST]', () => {
    describe('/users/blocks/{nickname}', () => {
      it('[ValidCase] 차단 추가할때', async () => {
        const user: UserModel = await testData.createBasicUser('user');
        const target: UserModel = await testData.createBasicUser('target');
        const token = await testData.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/blocks/${target.nickname}`,
        );

        expect(response.status).toBe(201);
      });

      it('[ValidCase] 이미 차단된 사용자', async () => {
        const user: UserModel = await testData.createBasicUser('user');
        const target: UserModel = await testData.createBasicUser('target');
        await testData.createUserBlocks(user, target);
        const token = await testData.giveTokenToUser(user);
        const response = await req(
          token,
          'POST',
          `/users/blocks/${target.nickname}`,
        );

        expect(response.status).toBe(201);
      });

      it('[InvalidCase] 차단할 사용자가 없는 경우', async () => {
        const user: UserModel = await testData.createBasicUser('user');
        const target = 'invalidNicknameLikeLoveMeLikeThisLoveMeLikeThat';
        const token = await testData.giveTokenToUser(user);
        const response = await req(token, 'POST', `/users/blocks/${target}`);

        expect(response.status).toBe(400);
      });
    });
  });
  describe('[DELETE]', () => {
    describe('/users/blocks/{nickname}', () => {
      it('[ValidCase] 차단이 해제되는지', async () => {
        const user: UserModel = await testData.createBasicUser('user');
        const target: UserModel = await testData.createBasicUser('target');
        await testData.createUserBlocks(user, target);
        const token = await testData.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/blocks/${target.nickname}`,
        );

        expect(response.status).toBe(200);
      });

      it('[InvalidCase] 차단 목록에 없는 유저를 해제하려할때 에러응답', async () => {
        const user: UserModel = await testData.createBasicUser('user');
        const target: UserModel = await testData.createBasicUser('target');
        const token = await testData.giveTokenToUser(user);
        const response = await req(
          token,
          'DELETE',
          `/users/blocks/${target.nickname}`,
        );

        expect(response.status).toBe(400);
      });

      it('[InvalidCase] 차단 해제할 사용자가 없는 경우', async () => {
        const user: UserModel = await testData.createBasicUser('user');
        const target = 'invalidNicknameLikeLoveMeLikeThisLoveMeLikeThat';
        const token = await testData.giveTokenToUser(user);
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
