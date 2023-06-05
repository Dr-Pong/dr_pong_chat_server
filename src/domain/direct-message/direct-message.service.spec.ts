import { Test, TestingModule } from '@nestjs/testing';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageTestService } from './test/direct-message.test.service';
import { DataSource, Repository } from 'typeorm';
import { DirectMessage } from './direct-message.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { DirectMessageModule } from './direct-message.module';
import { TestModule } from './test/direct-message.test.module';
import { PostDirectMessageDto } from './dto/post.direct-message.dto';
import { GetDirectMessageHistoryDto } from './dto/get.direct-message.history.dto';
import { GetDirectMessageHistoryResponseDto } from './dto/get.direct-message.history.response.dto';
import { DirectMessageRoomModule } from '../direct-message-room/direct-message-room.module';
import { DirectMessageRoom } from '../direct-message-room/direct-message-room.entity';

describe('DmLogService', () => {
  let service: DirectMessageService;
  let testData: DirectMessageTestService;
  let dataSources: DataSource;
  let dmlogRepository: Repository<DirectMessage>;
  let dmRoomlogRepository: Repository<DirectMessageRoom>;

  beforeAll(async () => {
    initializeTransactionalContext();
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
        DirectMessageRoomModule,
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
    dmRoomlogRepository = module.get<Repository<DirectMessageRoom>>(
      getRepositoryToken(DirectMessageRoom),
    );
  });

  beforeEach(async () => {
    await testData.createProfileImages();
    await testData.createBasicUsers(20);
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
        await testData.createDirectMessageToUser1(20);

        const userDirectMessegeDto: GetDirectMessageHistoryDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
          offset: null,
          count: 20,
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
        await testData.createDirectMessageToUser1(20);

        const userDirectMessegeDto: GetDirectMessageHistoryDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
          offset: null,
          count: 10,
        };

        const directMessagehistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessegeDto);

        expect(directMessagehistory.chats[0].nickname).toBe(
          testData.users[0].nickname,
        );

        expect(directMessagehistory.chats[1].nickname).toBe(
          testData.users[0].nickname,
        );

        expect(directMessagehistory.chats[0].message).toBe(
          testData.directMessage[0].message,
        );

        expect(directMessagehistory.chats[1].message).toBe(
          testData.directMessage[1].message,
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
    describe('Direct Message 전송', () => {
      it('[Valid Case] DM 전송(처음전송)', async () => {
        await testData.createUserFriends(10);

        const userDirectMessegeDto: PostDirectMessageDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
          message: '아아 테스트중log0',
        };

        await service.postDirectMessage(userDirectMessegeDto);

        const dmLog: DirectMessage[] = await dmlogRepository.find({
          where: {
            sender: { id: userDirectMessegeDto.userId },
            roomId: '1+2',
          },
        });
        const dmRoomLog: DirectMessageRoom[] = await dmRoomlogRepository.find({
          where: {
            userId: { id: userDirectMessegeDto.userId },
            friendId: { id: userDirectMessegeDto.friendId },
          },
        });

        expect(dmLog[0].sender.id).toBe(userDirectMessegeDto.userId);
        expect(dmLog[0].roomId).toBe('1+2');
        expect(dmLog[0].message).toBe(userDirectMessegeDto.message);

        expect(dmRoomLog[0].userId.id).toBe(userDirectMessegeDto.userId);
        expect(dmRoomLog[0].friendId.id).toBe(userDirectMessegeDto.friendId);
        expect(dmRoomLog[0].roomId).toBe('1+2');
        expect(dmRoomLog[0].lastReadMessageId).toBe(null);
        expect(dmRoomLog[0].isDisplay).toBe(true);
      });

      it('[Valid Case] DM 전송(있던방에 전송)', async () => {
        await testData.createUserFriends(10);
        await testData.createDirectMessageToUser1(10);
        await testData.createDirectMessageRoom();

        const userDirectMessegeDto: PostDirectMessageDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
          message: '아아 테스트중log0',
        };

        await service.postDirectMessage(userDirectMessegeDto);

        const dmLog: DirectMessage[] = await dmlogRepository.find({
          where: {
            sender: { id: userDirectMessegeDto.userId },
            roomId: '1+2',
          },
        });
        const dmRoomLog: DirectMessageRoom[] = await dmRoomlogRepository.find({
          where: {
            userId: { id: userDirectMessegeDto.userId },
            friendId: { id: userDirectMessegeDto.friendId },
          },
        });

        expect(dmLog[0].sender.id).toBe(userDirectMessegeDto.userId);
        expect(dmLog[0].roomId).toBe('1+2');

        expect(dmRoomLog[0].userId.id).toBe(userDirectMessegeDto.userId);
        expect(dmRoomLog[0].friendId.id).toBe(userDirectMessegeDto.friendId);
        expect(dmRoomLog[0].roomId).toBe('1+2');
        expect(dmRoomLog[0].lastReadMessageId).toBe(11);
        expect(dmRoomLog[0].isDisplay).toBe(true);
      });

      it('[Valid Case] 친구가 아닌 유저에게 전송이 불가능한지', async () => {
        await testData.createUserFriends(10);
        const userDirectMessegeDto: PostDirectMessageDto = {
          userId: testData.users[0].id,
          friendId: testData.users[13].id,
          message: '안가야하는log0',
        };

        await service.postDirectMessage(userDirectMessegeDto);

        const dmLog: DirectMessage[] = await dmlogRepository.find({
          where: {
            sender: { id: testData.users[0].id },
          },
        });

        expect(dmLog.length).toBe(0);
      });
    });
  });
});
