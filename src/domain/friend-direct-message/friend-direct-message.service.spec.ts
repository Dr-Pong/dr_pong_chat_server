import { DataSource, Repository } from 'typeorm';
import { FriendDirectMessageService } from './friend-direct-message.service';
import { TestService } from './test/test.service';
import { FriendDirectMessage } from './friend-direct-message.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { FriendDirectMessageModule } from './friend-direct-message.module';
import { TestModule } from '../frined/test/test.module';

describe('DmLogService', () => {
  let service: FriendDirectMessageService;
  let testData: TestService;
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
    testData = module.get<TestService>(TestService);
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
});
