import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from '../../../app.module';
import * as request from 'supertest';
import { ChannelTestData } from '../../data/channel.test.data';
import { UserModel } from 'src/domain/factory/model/user.model';
import {
  CHANNEL_PROTECTED,
  CHANNEL_PUBLIC,
} from '../../../domain/channel/type/type.channel';
import { CHANNEL_PRIVATE } from '../../../domain/channel/type/type.channel';
import { ChannelModel } from 'src/domain/factory/model/channel.model';
import { ChannelFactory } from 'src/domain/factory/channel.factory';
import { UserFactory } from 'src/domain/factory/user.factory';
import { TestDataModule } from 'src/test/data/test.data.module';
import { UserTestData } from 'src/test/data/user.test.data';
import { User } from 'src/domain/user/user.entity';

describe('BlockController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let channelFactory: ChannelFactory;
  let userFactory: UserFactory;
  let channelData: ChannelTestData;
  let userData: UserTestData;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestDataModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    channelData = module.get<ChannelTestData>(ChannelTestData);
    userData = module.get<UserTestData>(UserTestData);
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
    userData.clear();
    userFactory.users.clear();
    channelFactory.channels.clear();
    await dataSources.synchronize(true);
  });

  describe('[PATCH]', () => {
    describe('/channels/{roomId}', () => {
      it('채널정보 수정 public -> private', async () => {
        const owner: User = await userData.createUser('owner');
        const channel = await channelData.createChannel(
          owner.id,
          'channel',
          CHANNEL_PUBLIC,
        );
        const token = await userData.giveTokenToUser(owner);
        const response = await req(token, 'PATCH', `/channels/${channel.id}`, {
          access: CHANNEL_PRIVATE,
        });

        expect(response.status).toBe(200);
      });

      it('채널정보 수정 public -> protected', async () => {
        const owner: User = await userData.createUser('owner');
        const channel = await channelData.createChannel(
          owner.id,
          'channel',
          CHANNEL_PUBLIC,
        );
        const token = await userData.giveTokenToUser(owner);
        const response = await req(token, 'PATCH', `/channels/${channel.id}`, {
          access: CHANNEL_PUBLIC,
          password: 'password',
        });

        expect(response.status).toBe(200);
      });

      it('채널정보 수정 private -> public', async () => {
        const owner: User = await userData.createUser('owner');
        const channel = await channelData.createChannel(
          owner.id,
          'channel',
          CHANNEL_PRIVATE,
        );
        const token = await userData.giveTokenToUser(owner);
        const response = await req(token, 'PATCH', `/channels/${channel.id}`, {
          access: CHANNEL_PUBLIC,
        });

        expect(response.status).toBe(200);
      });
      it('채널정보 수정 private -> protected', async () => {
        const owner: User = await userData.createUser('owner');
        const channel = await channelData.createChannel(
          owner.id,
          'channel',
          CHANNEL_PRIVATE,
        );
        const token = await userData.giveTokenToUser(owner);
        const response = await req(token, 'PATCH', `/channels/${channel.id}`, {
          access: CHANNEL_PUBLIC,
          password: 'password',
        });

        expect(response.status).toBe(200);
      });

      it('채널정보 수정 protected -> public', async () => {
        const owner: User = await userData.createUser('owner');
        const channel = await channelData.createChannel(
          owner.id,
          'channel',
          CHANNEL_PROTECTED,
        );
        const token = await userData.giveTokenToUser(owner);
        const response = await req(token, 'PATCH', `/channels/${channel.id}`, {
          access: CHANNEL_PUBLIC,
        });

        expect(response.status).toBe(200);
      });

      it('채널정보 수정 protected -> private', async () => {
        const owner: User = await userData.createUser('owner');
        const channel = await channelData.createChannel(
          owner.id,
          'channel',
          CHANNEL_PROTECTED,
        );
        const token = await userData.giveTokenToUser(owner);
        const response = await req(token, 'PATCH', `/channels/${channel.id}`, {
          access: CHANNEL_PRIVATE,
        });

        expect(response.status).toBe(200);
      });
    });
    describe('[POST]', () => {
      describe('/channels/{roomId}/admin/{nickname}', () => {
        it('채널 관리자 추가', async () => {
          const channel: ChannelModel = await channelData.createBasicChannel(
            'normal',
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );

          const token = await userData.giveTokenToUser(owner);
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
          const channel: ChannelModel = await channelData.createBasicChannel(
            'normal',
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );
          const token = await userData.giveTokenToUser(owner);
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
          const channel: ChannelModel = await channelData.createBasicChannel(
            'normal',
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );
          const token = await userData.giveTokenToUser(owner);
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
          const owner: User = await userData.createUser('owner');
          const channel: ChannelModel = await channelData.createChannel(
            owner.id,
            'channel',
            CHANNEL_PUBLIC,
          );
          const token = await userData.giveTokenToUser(owner);
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
          const channel: ChannelModel =
            await channelData.createChannelWithAdmins(10);
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );

          const token = await userData.giveTokenToUser(owner);
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
            await channelData.createChannelWithMutedAdmins(10);
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );

          const token = await userData.giveTokenToUser(owner);
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
          const channel: ChannelModel = await channelData.createBasicChannel(
            'normal',
            10,
          );
          const iteratror = channel.users.values();
          iteratror.next();
          const owner: UserModel = userFactory.findById(channel.ownerId);
          const target: UserModel = userFactory.findById(
            iteratror.next().value,
          );

          const token = await userData.giveTokenToUser(owner);
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
