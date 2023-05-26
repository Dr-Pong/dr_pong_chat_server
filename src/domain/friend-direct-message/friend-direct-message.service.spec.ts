import { DataSource, Repository } from 'typeorm';
import { FriendDirectMessageService } from './friend-direct-message.service';
import { FriendDirectMessage } from './friend-direct-message.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { FriendDirectMessageModule } from './friend-direct-message.module';
import { FriendDirectMessageTestService } from './test/friend-direct-message.test.service';
import { TestModule } from './test/friend-direct-message.test.module';

describe('DmLogService', () => {
  let service: FriendDirectMessageService;
  let testData: FriendDirectMessageTestService;
  let dataSources: DataSource;
  let FriendDirectMessageRepository: Repository<FriendDirectMessage>;

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
        FriendDirectMessageModule,
        TestModule,
      ],
    }).compile();

    service = module.get<FriendDirectMessageService>(
      FriendDirectMessageService,
    );
    testData = module.get<FriendDirectMessageTestService>(
      FriendDirectMessageTestService,
    );
    dataSources = module.get<DataSource>(DataSource);
    FriendDirectMessageRepository = module.get<Repository<FriendDirectMessage>>(
      getRepositoryToken(FriendDirectMessage),
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
  describe('Friend Direct Message Service Logic', () => {
    describe('진행중인 DirectMessage 목록 조회', () => {
      it('[Valid Case] 대화방의 형식 확인 (이미지, 이름)', async () => {
        await testData.createFriendDirectMessages(1);
      });
      it('[Valid Case] 현재 진행중인 DM목록 반환', async () => {});
      it('[Valid Case] 진행중인 DM목록이 없을때 확인', async () => {});
    });
    describe('진행중인 DirectMessage 목록 삭제', () => {
      it('[Valid Case] DM 목록에서 삭제', async () => {});
      it('[Valid Case] DM 목록에서 삭제후 다시 DM 입력해서 목록 반환해보기', async () => {});
    });
    describe('친구 삭제시 DirectMessage 목록유무 체크', () => {
      it('[Valid Case]내가 친구 삭제시 DM이 목록에 없는지 조회', async () => {});
      it('[Valid Case] 내가 친구 삭제 당했을때 DM 목록에 있는지 조회', async () => {});
    });
    describe('진행중인 DirectMessage 알람 받기', () => {
      it('[Valid Case] 대화방의 알람수령', async () => {});
      it('[Valid Case] 새로온 DM 의 수 반환', async () => {});
    });
  });
});
