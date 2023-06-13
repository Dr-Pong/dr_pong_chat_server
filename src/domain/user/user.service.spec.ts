import { DataSource, Not, Repository } from 'typeorm';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserTestService } from './test/user.test.service';
import { User } from './user.entity';
import { UserModule } from './user.module';
import { UserTestModule } from './test/user.test.module';
import { BadRequestException } from '@nestjs/common';
import { PostGatewayUserDto } from './dto/post.gateway.users.dto';
import { UserModel } from '../factory/model/user.model';
import { UserFactory } from '../factory/user.factory';

describe('UserService', () => {
  let service: UserService;
  let testData: UserTestService;
  let dataSources: DataSource;
  let userRepository: Repository<User>;
  let userFactory: UserFactory;

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
        UserModule,
        UserTestModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    userFactory = module.get<UserFactory>(UserFactory);
    service = module.get<UserService>(UserService);
    testData = module.get<UserTestService>(UserTestService);
    dataSources = module.get<DataSource>(DataSource);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
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

  describe('UserService', () => {
    describe('nickname으로 id 조회', () => {
      it('조회 성공', async () => {
        const query = 'user0';
        const targetId = await service.getIdFromNickname({ nickname: query });
        const repoUser = await userRepository.findOne({
          where: { nickname: query },
        });
        expect(targetId?.id).not.toBeNull();
        expect(targetId?.id).toBe(repoUser?.id);
      });
    });
    describe('친구요청', () => {
      it('조회 실패(없는 닉네임)', async () => {
        const query = 'hakim';
        await expect(
          service.getIdFromNickname({ nickname: query }),
        ).rejects.toThrow(new BadRequestException('No such User'));
      });
    });
    describe('친구 Gateway저장', () => {
      it('GateWay User 저장 테스트', async () => {
        await testData.createProfileImages();

        const gateWayUser: PostGatewayUserDto = {
          id: 1,
          nickname: 'test',
          imgId: testData.profileImages[0].id,
          imgUrl: testData.profileImages[0].url,
        };

        await service.postGatewayUser(gateWayUser);

        const result: User = await userRepository.findOne({
          where: { id: gateWayUser.id },
        });
        const savedUserFt: UserModel = userFactory.findById(gateWayUser.id);

        expect(savedUserFt.id).toBe(gateWayUser.id);
        expect(savedUserFt.nickname).toBe(gateWayUser.nickname);

        expect(result.id).toBe(gateWayUser.id);
        expect(result.nickname).toBe(gateWayUser.nickname);
        expect(result.image.id).toBe(gateWayUser.imgId);
        expect(result.image.url).toBe(gateWayUser.imgUrl);
      });
    });
  });
});
