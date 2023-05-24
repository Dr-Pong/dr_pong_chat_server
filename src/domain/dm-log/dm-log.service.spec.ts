import { Test, TestingModule } from '@nestjs/testing';
import { DmLogService } from './dm-log.service';
import { TestService } from './test/test.service';
import { DataSource, Repository } from 'typeorm';
import { DmLog } from './dm-log.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DmLogModule } from './dm-log.module';
import { TestModule } from './test/test.module';
import { PostDmLogDto } from './dto/post.dm-log.dto';
import { FriendChatManager } from 'src/global/utils/generate.room.id';

describe('DmLogService', () => {
  let service: DmLogService;
  let testData: TestService;
  let dataSources: DataSource;
  let dmlogRepository: Repository<DmLog>;

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
        DmLogModule,
        TestModule,
      ],
    }).compile();

    service = module.get<DmLogService>(DmLogService);
    testData = module.get<TestService>(TestService);
    dataSources = module.get<DataSource>(DataSource);
    dmlogRepository = module.get<Repository<DmLog>>(getRepositoryToken(DmLog));
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

  describe('DM LOG Service Logic', () => {
    describe('DM 대화 내역 조회', () => {
      it('[Valid Case] 대화 내역 형식 확인 (닉네임, 사진, 생성일)', async () => {});
      it('[Valid Case] 존재하는 대화 내역 조회', async () => {});
      it('[Valid Case] 비어있는 대화 내역 조회', async () => {});
    });
    describe('DM 전송', () => {
      it('[Valid Case] DM 전송', async () => {
        await testData.createUserFriends(10);
        await testData.createDmLog(10, 10);

        const userDirectMessegeDto: PostDmLogDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postDmLogRequestByNickname(userDirectMessegeDto);

        const dmLog: DmLog[] = await dmlogRepository.find({
          where: {
            sender: { id: testData.users[0].id },
            roomId: FriendChatManager.generateRoomId(
              testData.users[0].nickname,
              testData.users[1].nickname,
            ),
          },
        });

        expect(dmLog).toHaveProperty('sender');
        expect(dmLog).toHaveProperty('receiver');
        expect(dmLog).toHaveProperty('log');

        expect(dmLog[0].sender).toBe(testData.users[0]);
        expect(dmLog[0].roomId).toBe(testData.dmLogs[0].roomId);
        expect(dmLog[0].log).toBe('log0');

        expect(dmLog[1].sender).toBe(testData.users[0]);
        expect(dmLog[1].roomId).toBe(testData.dmLogs[1].roomId);
        expect(dmLog[1].log).toBe('log1');
      });
      it('[Valid Case] 친구가 아닌 유저에게 전송이 가능한지', async () => {
        await testData.createDmLog(10, 10);

        const userDirectMessegeDto: PostDmLogDto = {
          userId: testData.users[0].id,
          friendId: testData.users[10].id,
        };

        await service.postDmLogRequestByNickname(userDirectMessegeDto);

        const dmLog: DmLog[] = await dmlogRepository.find({
          where: {
            sender: { id: testData.users[0].id },
            roomId: FriendChatManager.generateRoomId(
              testData.users[0].nickname,
              testData.users[10].nickname,
            ),
          },
        });

        expect(dmLog).toBeNull();
      });
    });
    describe('진행중인 DM 목록 조회', () => {
      it('[Valid Case] DM 목록의 형식확인 (이미지, 이름)', async () => {});
      it('[Valid Case] 현재 진행중인 DM 목록 반환', async () => {});
    });
    describe('진행중인 DM 목록 삭제', () => {
      it('[Valid Case] 특정 대화방을 목록에서 삭제 가능한지', async () => {});
      it('[Valid Case] 목록에서 삭제한 대화방에 다시 입력해서 대화 불러오는지 확인', async () => {});
    });
  });
});
