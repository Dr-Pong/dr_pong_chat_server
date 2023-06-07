import { Test, TestingModule } from '@nestjs/testing';
import { BlockController } from './block.controller';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlockTestService } from '../test/block.test.service';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from '../../../app.module';
import { UserModel } from 'src/domain/factory/model/user.model';

describe('BlockController', () => {
  let app: INestApplication;
  let dataSources: DataSource;
  let testService: BlockTestService;

  beforeAll(async () => {
    initializeTransactionalContext();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    testService = module.get<BlockTestService>(BlockTestService);
    dataSources = module.get<DataSource>(DataSource);
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    const user1: UserModel = await testService.createBasicUser('user1');
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
      it('[ValidCase] 차단목록 조회', async () => {});
      it('[ValidCase] 차단목록이 빈경우', async () => {});
    });
  });
  describe('[POST]', () => {
    describe('/users/blocks/{nickname}', () => {
      it('[ValidCase] 차단 추가', async () => {});
      it('[ValidCase] 이미 차단된 사용자', async () => {});
      it('[InvalidCase] 차단할 사용자가 없는 경우', async () => {});
    });
  });
  describe('[DELETE]', () => {
    describe('/users/blocks/{nickname}', () => {
      it('[ValidCase] 차단이 해제되는지', async () => {});
      it('[InvalidCase] 차단 목록에 없는 유저를 해제하려할때 에러응답', async () => {});
    });
  });
});
