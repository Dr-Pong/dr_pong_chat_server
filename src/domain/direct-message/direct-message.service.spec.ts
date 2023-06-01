import { Test, TestingModule } from '@nestjs/testing';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageTestService } from './test/direct-message.test.service';
import { DataSource, Repository } from 'typeorm';
import { DirectMessage } from './direct-message.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DirectMessageModule } from './direct-message.module';
import { TestModule } from './test/direct-message.test.module';
import { PostDirectMessageDto } from './dto/post.direct-message.dto';
import { GetDirectMessageHistoryDto } from './dto/get.direct-message.history.dto';
import { GetDirectMessageHistoryResponseDto } from './dto/get.direct-message.history.response.dto';

describe('DmLogService', () => {
  let service: DirectMessageService;
  let testData: DirectMessageTestService;
  let dataSources: DataSource;
  let dmlogRepository: Repository<DirectMessage>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory() {
            return typeORMConfig;
          },
          async dataSourceFactory(options) {
            if (!options) {
              throw new Error('Invalid options passed');
            }
            return addTransactionalDataSource({
              dataSource: new DataSource(options),
            });
          },
        }),
        DirectMessageModule,
        TestModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(DirectMessage),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<DirectMessageService>(DirectMessageService);
    testData = module.get<DirectMessageTestService>(DirectMessageTestService);
    dataSources = module.get<DataSource>(DataSource);
    dmlogRepository = module.get<Repository<DirectMessage>>(
      getRepositoryToken(DirectMessage),
    );
  });

  beforeEach(async () => {
    await testData.createProfileImages();
    await testData.createBasicUsers(10);
  });

  afterEach(async () => {
    testData.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
  });

  describe('Direct Message Service Logic', () => {
    describe('Direct Message 대화 내역 조회', () => {
      it('[Valid Case] 대화 내역 형식 확인 (닉네임, 사진, 생성일)', async () => {
        await testData.createUserFriends(10);
        await testData.createDirectMessage(20);

        const userDirectMessegeDto: GetDirectMessageHistoryDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
          offset: testData.directMessage[9].id,
          count: 10,
        };

        const directMessagehistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessegeDto);

        expect(directMessagehistory).toHaveProperty('chats');
        expect(directMessagehistory.chats[0]).toHaveProperty('nickname');
        expect(directMessagehistory.chats[0]).toHaveProperty('message');
        expect(directMessagehistory.chats[0]).toHaveProperty('createdAt');
      });

      it('[Valid Case] 존재하는 대화 내역 조회', async () => {
        await testData.createUserFriends(10);
        await testData.createDirectMessage(20);

        const userDirectMessegeDto: GetDirectMessageHistoryDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
          offset: testData.directMessage[9].id,
          count: 10,
        };

        const directMessagehistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessegeDto);

        expect(directMessagehistory.chats[0].nickname).toBe(
          testData.users[0].nickname,
        );
        expect(directMessagehistory.chats[0].message).toBe(
          testData.directMessage[0].message,
        );
        expect(directMessagehistory.chats[0].createdAt).toBe(
          testData.directMessage[0].createdAt,
        );

        expect(directMessagehistory.chats[1].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(directMessagehistory.chats[1].message).toBe(
          testData.directMessage[1].message,
        );
        expect(directMessagehistory.chats[1].createdAt).toBe(
          testData.directMessage[1].createdAt,
        );

        expect(directMessagehistory.chats[9].message).toBe(
          testData.directMessage[9].message,
        );
      });

      it('[Valid Case] 비어있는 대화 내역 조회', async () => {
        await testData.createUserFriends(10);

        const userDirectMessegeDto: GetDirectMessageHistoryDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
          offset: null,
          count: 10,
        };

        const directMessagehistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessegeDto);

        expect(directMessagehistory.chats.length).toBe(0);
      });
    });
    // describe('Direct Message 전송', () => {
    //   it('[Valid Case] DM 전송', async () => {
    //     await testData.createUserFriends(10);
    //     await testData.createDirectMessage(10);

    //     const userDirectMessegeDto: PostDirectMessageDto = {
    //       userId: testData.users[0].id,
    //       friendId: testData.users[1].id,
    //     };

    //     await service.postDirectMessage(userDirectMessegeDto);

    //     const dmLog: DirectMessage[] = await dmlogRepository.find({
    //       where: {
    //         sender: { id: testData.users[0].id },
    //         roomId: testData.directMessage[0].roomId,
    //       },
    //     });

    //     expect(dmLog).toHaveProperty('sender');
    //     expect(dmLog).toHaveProperty('receiver');
    //     expect(dmLog).toHaveProperty('message');

    //     expect(dmLog[0].sender).toBe(testData.users[0]);
    //     expect(dmLog[0].roomId).toBe(testData.directMessage[0].roomId);
    //     expect(dmLog[0].message).toBe('log0');

    //     expect(dmLog[1].sender).toBe(testData.users[0]);
    //     expect(dmLog[1].roomId).toBe(testData.directMessage[1].roomId);
    //     expect(dmLog[1].message).toBe('log1');
    //   });
    //   it('[Valid Case] 친구가 아닌 유저에게 전송이 가능한지', async () => {
    //     await testData.createDirectMessage(10);

    //     const userDirectMessegeDto: PostDirectMessageDto = {
    //       userId: testData.users[0].id,
    //       friendId: testData.users[10].id,
    //     };

    //     await service.postDirectMessage(userDirectMessegeDto);

    //     const dmLog: DirectMessage[] = await dmlogRepository.find({
    //       where: {
    //         sender: { id: testData.users[0].id },
    //         roomId: testData.directMessage[0].roomId,
    //       },
    //     });

    //     expect(dmLog).toBeNull();
    //   });
    // });
  });
});
