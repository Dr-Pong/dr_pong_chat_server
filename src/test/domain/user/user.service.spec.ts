import { DataSource, Repository } from 'typeorm';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../domain/user/user.service';
import { UserTestData } from '../../data/user.test.data';
import { User } from '../../../domain/user/user.entity';
import { UserModule } from '../../../domain/user/user.module';
import { BadRequestException } from '@nestjs/common';
import { UserRelationDto } from '../../../domain/user/dto/user.relation.dto';
import {
  RELATION_BLOCKED,
  RELATION_FRIEND,
  RELATION_NONE,
} from 'src/global/type/type.user.relation';
import { UserFactory } from '../../../domain/factory/user.factory';
import { PostGatewayUserDto } from '../../../domain/user/dto/post.gateway.users.dto';
import { UserModel } from '../../../domain/factory/model/user.model';
import { TestDataModule } from 'src/test/data/test.data.module';
import { FriendTestData } from 'src/test/data/friend.test.data';
import { BlockTestData } from 'src/test/data/block.test.data';

describe('UserService', () => {
  let service: UserService;
  let userData: UserTestData;
  let friendData: FriendTestData;
  let blockData: BlockTestData;
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
        TestDataModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    userData = module.get<UserTestData>(UserTestData);
    friendData = module.get<FriendTestData>(FriendTestData);
    blockData = module.get<BlockTestData>(BlockTestData);
    userFactory = module.get<UserFactory>(UserFactory);
    service = module.get<UserService>(UserService);
    dataSources = module.get<DataSource>(DataSource);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    await dataSources.synchronize(true);
  });

  beforeEach(async () => {
    await userData.createProfileImage();
  });

  afterEach(async () => {
    userData.clear();
    jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
  });

  describe('getIdFromNickname(), 유저 닉네임으로 id 조회', () => {
    it('조회 성공', async () => {
      await userData.createBasicUsers(10);
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
      const user: User = await userData.createUser('user');
      const friend: User = await userData.createUser('friend');
      await friendData.makeFriend(user, friend);

      const relation: UserRelationDto = await service.getUserRelation({
        userId: user.id,
        targetId: friend.id,
      });

      expect(relation).toHaveProperty('status');
      expect(relation.status).toBe(RELATION_FRIEND);
    });

    it('[Valid Case] blocked 경우', async () => {
      const user: User = await userData.createUser('user');
      const blocked: User = await userData.createUser('block');
      await blockData.blockUser(user, blocked);

      const relation: UserRelationDto = await service.getUserRelation({
        userId: user.id,
        targetId: blocked.id,
      });

      expect(relation).toHaveProperty('status');
      expect(relation.status).toBe(RELATION_BLOCKED);
    });

    it('[Valid Case] none인 경우', async () => {
      const user: User = await userData.createUser('user');
      const user2: User = await userData.createUser('user2');

      const relation: UserRelationDto = await service.getUserRelation({
        userId: user.id,
        targetId: user2.id,
      });

      expect(relation).toHaveProperty('status');
      expect(relation.status).toBe(RELATION_NONE);
    });
    describe('친구 Gateway저장', () => {
      it('GateWay User 저장 테스트', async () => {
        const gateWayUser: PostGatewayUserDto = {
          id: 1,
          nickname: 'test',
          imgId: userData.profileImages[0].id,
          imgUrl: userData.profileImages[0].url,
        };

        await service.postUser(gateWayUser);

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
