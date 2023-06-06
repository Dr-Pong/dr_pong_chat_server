import { Test, TestingModule } from '@nestjs/testing';
import { BlockService } from './block.service';
import { BlockTestService } from './test/block.test.service';
import { DataSource, Repository } from 'typeorm';
import { Block } from './block.entity';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { TestModule } from './test/block.test.module';
import { BlockModule } from './block.module';

describe('BlockService', () => {
  let service: BlockService;
  let testData: BlockTestService;
  let dataSources: DataSource;
  let blockRepository: Repository<Block>;

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
        BlockModule,
        TestModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(Block),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<BlockService>(BlockService);
    testData = module.get<BlockTestService>(BlockTestService);
    dataSources = module.get<DataSource>(DataSource);
    blockRepository = module.get<Repository<Block>>(getRepositoryToken(Block));
  });

  beforeEach(async () => {
    await testData.createProfileImages();
    await testData.createBasicUsers(100);
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
  describe('차단관련 Service Logic', () => {
    describe('차단목록 조회', () => {
      it('[Valid Case] 차단형식 확인', async () => {});
      it('[Valid Case] 차단유저가 있는경우 ', async () => {});
      it('[Valid Case] 차단유저가 빈경우', async () => {});
    });
    describe('유저 차단', () => {
      it('[Valid Case] 유저가 차단되는지', async () => {});
      it('[Valid Case] 이전에 차단 목록에 차단할 유저가 있을때', async () => {});
      it('[Valid Case] 중복 차단 요청시 차단유지 및 백에서 씹는지', async () => {});
      it('[Error Case]  존재하지 않는 유저에 대한 차단 요청시 적절한 에러 응답', async () => {});
    });
    describe('차단 해제', () => {
      it('[Valid Case] 차단이 해제되는지', async () => {});
      it('[Valid Case] 차단해제후 차단목록에 없는지 조회', async () => {});
      it('[Error Case] 차단 목록에 없는 유저를 해제하려할때 에러응답', async () => {});
    });
  });
});
