import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserTestData } from '../../data/user.test.data';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';
import { User } from '../../../domain/user/user.entity';
import {
  RELATION_BLOCKED,
  RELATION_FRIEND,
  RELATION_NONE,
} from 'src/global/type/type.user.relation';
import { PostGatewayUserDto } from '../../../domain/user/dto/post.gateway.users.dto';
import { TestDataModule } from 'src/test/data/test.data.module';
import { FriendTestData } from 'src/test/data/friend.test.data';
import { BlockTestData } from 'src/test/data/block.test.data';
import { PatchUserImageDto } from 'src/domain/user/dto/patch.user.image.dto';
import { PatchUserImageRequestDto } from 'src/domain/user/dto/patch.user.image.request.dto';

describe('UserController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let userData: UserTestData;
  let friendData: FriendTestData;
  let blockData: BlockTestData;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestDataModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    userData = module.get<UserTestData>(UserTestData);
    friendData = module.get<FriendTestData>(FriendTestData);
    blockData = module.get<BlockTestData>(BlockTestData);
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
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

  describe('GET /users/{nickname}/relations/{targetnickname}', () => {
    it('[Valid Case] friend인 경우', async () => {
      const user: User = await userData.createUser('user1');
      const targetUser: User = await userData.createUser('user2');
      await friendData.makeFriend(user, targetUser);

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
      const user: User = await userData.createUser('user1');
      const targetUser: User = await userData.createUser('user2');
      await blockData.blockUser(user, targetUser);

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
      const user: User = await userData.createUser('user1');
      const targetUser: User = await userData.createUser('user2');

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
      const user: User = await userData.createUser('user1');

      const res = await req(
        null,
        'GET',
        `/users/${user.nickname}/relations/none`,
      );
      expect(res.status).toBe(400);
    });

    it('[Error Case] user가 없는 유저인 경우', async () => {
      const user: User = await userData.createUser('user1');

      const res = await req(
        null,
        'GET',
        `/users/none/relations/${user.nickname}`,
      );
      expect(res.status).toBe(400);
    });
  });

  describe('POST /users', () => {
    it('유저 저장 테스트', async () => {
      await userData.createProfileImage();
      const postGatewayUserDto: PostGatewayUserDto = {
        id: 1,
        nickname: 'Controllertest',
        imgId: userData.profileImages[0].id,
        imgUrl: userData.profileImages[0].url,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(postGatewayUserDto);

      expect(response.status).toBe(201);
    });
  });

  describe('PATCH /users/{nickname}/image', () => {
    it('유저 이미지 변경 테스트', async () => {
      const user: User = await userData.createUser('user1');
      const token = await userData.giveTokenToUser(user);
      const PatchUserImageRequest: PatchUserImageRequestDto = {
        imgId: userData.profileImages[0].id,
      };

      const response = await req(
        token,
        'PATCH',
        `/users/${user.nickname}/image`,
        PatchUserImageRequest,
      );

      expect(response.status).toBe(200);
    });

    it('유저 이미지 변경 테스트 (이미지가 없는 경우)', async () => {
      const user: User = await userData.createUser('user1');
      const token = await userData.giveTokenToUser(user);
      const PatchUserImageRequest: PatchUserImageRequestDto = {
        imgId: 123,
      };

      const response = await req(
        token,
        'PATCH',
        `/users/${user.nickname}/image`,
        PatchUserImageRequest,
      );

      expect(response.status).toBe(404);
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
