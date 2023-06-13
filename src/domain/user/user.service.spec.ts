import { DataSource, Repository } from 'typeorm';
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
import { Friend } from '../friend/friend.entity';
import { Block } from '../block/block.entity';
import { UserRelationDto } from './dto/user.relation.dto';
import { FRIENDSTATUS_FRIEND } from 'src/global/type/type.friend.status';
import {
  RELATION_BLOCKED,
  RELATION_FRIEND,
  RELATION_NONE,
} from 'src/global/type/type.user.relation';

describe('UserService', () => {
  let service: UserService;
  let testData: UserTestService;
  let dataSources: DataSource;
  let userRepository: Repository<User>;
  let friendRepository: Repository<Friend>;
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

    service = module.get<UserService>(UserService);
    testData = module.get<UserTestService>(UserTestService);
    dataSources = module.get<DataSource>(DataSource);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    await testData.createProfileImages();
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

  describe('getIdFromNickname(), 유저 닉네임으로 id 조회', () => {
    it('조회 성공', async () => {
      await testData.createBasicUsers(10);
      const query = 'user0';
      const targetId = await service.getIdFromNickname({ nickname: query });
      const repoUser = await userRepository.findOne({
        where: { nickname: query },
      });
      expect(targetId?.id).not.toBeNull();
      expect(targetId?.id).toBe(repoUser?.id);
    });
    it('조회 실패(없는 닉네임)', async () => {
      const query = 'hakim';
      await expect(
        service.getIdFromNickname({ nickname: query }),
      ).rejects.toThrow(new BadRequestException('No such User'));
    });
  });

  describe('getUserRelation(), 유저 관계 조회 서비스', () => {
    it('[Valid Case] friend인 경우', async () => {
      const user: User = await testData.createBasicUser('user');
      const friend: User = await testData.createBasicUser('friend');
      await testData.makeFriend(user, friend);

      const relation: UserRelationDto = await service.getUserRelation({
        userId: user.id,
        targetId: friend.id,
      });

      expect(relation).toHaveProperty('status');
      expect(relation.status).toBe(RELATION_FRIEND);
    });

    it('[Valid Case] blocked 경우', async () => {
      const user: User = await testData.createBasicUser('user');
      const blocked: User = await testData.createBasicUser('block');
      await testData.makeBlock(user, blocked);

      const relation: UserRelationDto = await service.getUserRelation({
        userId: user.id,
        targetId: blocked.id,
      });

      expect(relation).toHaveProperty('status');
      expect(relation.status).toBe(RELATION_BLOCKED);
    });

    it('[Valid Case] none인 경우', async () => {
      const user: User = await testData.createBasicUser('user');
      const user2: User = await testData.createBasicUser('user2');

      const relation: UserRelationDto = await service.getUserRelation({
        userId: user.id,
        targetId: user2.id,
      });

      expect(relation).toHaveProperty('status');
      expect(relation.status).toBe(RELATION_NONE);
    });
  });
});
