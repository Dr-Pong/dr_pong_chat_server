import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from '../../../app.module';
import * as request from 'supertest';
import { ChannelTestService } from '../test/channel.test.service';
import { UserModel } from 'src/domain/factory/model/user.model';
import { ChannlTestModule } from '../test/channel.test.module';
import { CHANNEL_PUBLIC } from '../type/type.channel';
import { CHANNEL_PRIVATE } from '../type/type.channel';
import { ChannelModel } from 'src/domain/factory/model/channel.model';
import { ChannelFactory } from 'src/domain/factory/channel.factory';
import { UserFactory } from 'src/domain/factory/user.factory';

describe('BlockController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let channelFactory: ChannelFactory;
  let userFactory: UserFactory;
  let testData: ChannelTestService;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ChannlTestModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    testData = module.get<ChannelTestService>(ChannelTestService);
    dataSources = module.get<DataSource>(DataSource);
    channelFactory = module.get<ChannelFactory>(ChannelFactory);
    userFactory = module.get<UserFactory>(UserFactory);
    await dataSources.synchronize(true);
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
    await app.close();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    userFactory.users.clear();
    channelFactory.channels.clear();
    await dataSources.synchronize(true);
  });

  describe('[PATCH]', () => {
    describe('/channels/{roomId}', () => {
      it('채널정보 수정 public -> private', async () => {
        const owner: UserModel = await testData.createBasicUser('owner');
        const channel = await testData.createChannel(
          owner,
          'channel',
          CHANNEL_PUBLIC,
        );
        const token = await testData.giveTokenToUser(owner);
        const response = await req(token, 'PATCH', `/channels/${channel.id}`, {
          access: CHANNEL_PRIVATE,
        });

        expect(response.status).toBe(200);
      });
    });
    describe('[POST]', () => {
      describe('/channels/{roomId}/admin/{nickname}', () => {
        it('채널 관리자 추가', async () => {
          const channel: ChannelModel = await testData.createBasicChannel(
            'normal',
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );

          const token = await testData.giveTokenToUser(owner);
          const response = await req(
            token,
            'POST',
            `/channels/${channel.id}/admin/${target.nickname}`,
          );

          expect(response.status).toBe(201);
        });
      });
      describe('/channels/{roomId}/ban/{nickname}', () => {
        it('채널 유저 차단', async () => {
          const channel: ChannelModel = await testData.createBasicChannel(
            'normal',
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );
          const token = await testData.giveTokenToUser(owner);
          const response = await req(
            token,
            'POST',
            `/channels/${channel.id}/ban/${target.nickname}`,
          );

          expect(response.status).toBe(201);
        });
      });
      describe('/channels/{roomId}/mute/{nickname}', () => {
        it('채널 유저 뮤트', async () => {
          const channel: ChannelModel = await testData.createBasicChannel(
            'normal',
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );
          const token = await testData.giveTokenToUser(owner);
          const response = await req(
            token,
            'POST',
            `/channels/${channel.id}/mute/${target.nickname}`,
          );

          expect(response.status).toBe(201);
        });
      });
    });
    describe('[DELETE]', () => {
      describe('/channels/{roomId}', () => {
        it('채널 삭제', async () => {
          const owner: UserModel = await testData.createBasicUser('owner');
          const channel: ChannelModel = await testData.createChannel(
            owner,
            'channel',
            CHANNEL_PUBLIC,
          );
          const token = await testData.giveTokenToUser(owner);
          const response = await req(
            token,
            'DELETE',
            `/channels/${channel.id}`,
          );

          expect(response.status).toBe(200);
        });
      });
      describe('/channels/{roomId}/admin/{nickname}', () => {
        it('채널 관리자 삭제', async () => {
          const channel: ChannelModel = await testData.createChannelWithAdmins(
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );

          const token = await testData.giveTokenToUser(owner);
          const response = await req(
            token,
            'DELETE',
            `/channels/${channel.id}/admin/${target.nickname}`,
          );

          expect(response.status).toBe(200);
        });
      });
      describe('/channels/{roomId}/mute/{nickname}', () => {
        it('채널 유저 뮤트 풀기', async () => {
          const channel: ChannelModel =
            await testData.createChannelWithMutedAdmins(10);
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );

          const token = await testData.giveTokenToUser(owner);
          const response = await req(
            token,
            'DELETE',
            `/channels/${channel.id}/mute/${target.nickname}`,
          );

          expect(response.status).toBe(200);
        });
      });
      describe('/channels/{roomId}/kick/{nickname}', () => {
        it('채널 유저 강퇴', async () => {
          const channel: ChannelModel = await testData.createBasicChannel(
            'normal',
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );

          const token = await testData.giveTokenToUser(owner);
          const response = await req(
            token,
            'DELETE',
            `/channels/${channel.id}/kick/${target.nickname}`,
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
});
