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
import { BlockModule } from './block.module';
import { GetUserBlocksDto } from './dto/get.user.blocks.dto';
import { UserBlocksDto } from './dto/user.blocks.dto';
import { UserModel } from '../factory/model/user.model';
import { UserFactory } from '../factory/user.factory';
import { PostUserBlockDto } from './dto/post.user.block.dto';
import { BadRequestException } from '@nestjs/common';
import { DeleteUserBlockDto } from './dto/delete.user.block.dto';
import { BlockTestModule } from './test/block.test.module';

describe('BlockService', () => {
  let service: BlockService;
  let testData: BlockTestService;
  let dataSources: DataSource;
  let blockRepository: Repository<Block>;
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
        BlockModule,
        BlockTestModule,
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
    userFactory = module.get<UserFactory>(UserFactory);
  });

  afterEach(async () => {
    userFactory.users.clear();
    // jest.resetAllMocks();
    await dataSources.synchronize(true);
  });

  afterAll(async () => {
    await dataSources.dropDatabase();
    await dataSources.destroy();
  });
  describe('차단관련 Service Logic', () => {
    describe('GET 차단목록 조회', () => {
      it('[Valid Case] 차단형식 확인 차단유저가 있는경우', async () => {
        const user1: UserModel = await testData.createBasicUser('user1');
        const user2: UserModel = await testData.createBasicUser('user2');
        await testData.createUserBlocks(user1, user2);

        const blockListDto: GetUserBlocksDto = {
          userId: user1.id,
        };

        const blockList: UserBlocksDto = await service.getUserBlocks(
          blockListDto,
        );

        expect(blockList).toHaveProperty('users');
        expect(blockList.users[0]).toHaveProperty('nickname');
        expect(blockList.users[0]).toHaveProperty('imgUrl');

        expect(blockList.users[0].nickname).toBe(user2.nickname);
      });

      it('[Valid Case] 차단유저가 빈경우', async () => {
        const user: UserModel = await testData.createBasicUser('user1');
        const blockListDto: GetUserBlocksDto = {
          userId: user.id,
        };

        const blockList: UserBlocksDto = await service.getUserBlocks(
          blockListDto,
        );

        expect(blockList.users.length).toBe(0);
      });
    });
    describe('POST 유저 차단', () => {
      it('[Valid Case] 유저가 차단되는지', async () => {
        const user1: UserModel = await testData.createBasicUser('user1');
        const user2: UserModel = await testData.createBasicUser('user2');
        const userBlockDto: PostUserBlockDto = {
          userId: user1.id,
          targetId: user2.id,
        };

        await service.postUserBlocks(userBlockDto);

        const BlocksDb: Block = await blockRepository.findOne({
          where: {
            user: { id: user1.id },
            blockedUser: { id: user2.id },
          },
        });
        expect(BlocksDb.user.id).toBe(user1.id);
        expect(BlocksDb.blockedUser.id).toBe(user2.id);

        const UserFt: UserModel = userFactory.findById(user1.id);
        expect(UserFt.blockedList.size).toBe(1);
        expect(UserFt.blockedList.has(user2.id)).toBe(true);
      });

      it('[Valid Case] 이전에 차단 목록에 차단할 유저가 있을때', async () => {
        const user1: UserModel = await testData.createBasicUser('user1');
        const user2: UserModel = await testData.createBasicUser('user2');
        await testData.createUserBlocks(user1, user2);

        const userBlockDto: PostUserBlockDto = {
          userId: user1.id,
          targetId: user2.id,
        };

        await service.postUserBlocks(userBlockDto);

        const BlocksDb: Block = await blockRepository.findOne({
          where: {
            user: { id: user1.id },
            blockedUser: { id: user2.id },
          },
        });
        expect(BlocksDb.user.id).toBe(user1.id);
        expect(BlocksDb.blockedUser.id).toBe(user2.id);

        const UserFt: UserModel = userFactory.findById(user1.id);
        expect(UserFt.blockedList.size).toBe(1);
        expect(UserFt.blockedList.has(user2.id)).toBe(true);
      });

      it('[Error Case]  존재하지 않는 유저에 대한 차단 요청시 적절한 에러 응답', async () => {
        const user1: UserModel = await testData.createBasicUser('user1');
        const userBlockDto: PostUserBlockDto = {
          userId: user1.id,
          targetId: 123456789,
        };

        await expect(service.postUserBlocks(userBlockDto)).rejects.toThrowError(
          new BadRequestException('Invalid userId'),
        );
      });
    });
    describe('DELETE 차단 해제', () => {
      it('[Valid Case] 차단이 해제되는지', async () => {
        const user1: UserModel = await testData.createBasicUser('user1');
        const user2: UserModel = await testData.createBasicUser('user2');
        await testData.createUserBlocks(user1, user2);

        const userBlockDto: DeleteUserBlockDto = {
          userId: user1.id,
          targetId: user2.id,
        };

        await service.deleteUserBlocks(userBlockDto);

        const BlocksDb: Block = await blockRepository.findOne({
          where: {
            user: { id: user1.id },
            blockedUser: { id: user2.id },
          },
        });
        expect(BlocksDb.isUnblocked).toBe(true);

        const UserFt: UserModel = userFactory.findById(user1.id);
        expect(UserFt.blockedList.size).toBe(0);
        expect(UserFt.blockedList.has(user2.id)).toBe(false);
      });

      it('[Error Case] 차단 목록에 없는 유저를 해제하려할때 에러응답', async () => {
        const user1: UserModel = await testData.createBasicUser('user1');
        const user2: UserModel = await testData.createBasicUser('user2');

        const userBlockDto: DeleteUserBlockDto = {
          userId: user1.id,
          targetId: user2.id,
        };

        await expect(
          service.deleteUserBlocks(userBlockDto),
        ).rejects.toThrowError(new BadRequestException('Invalid userId'));
      });
    });
  });
});
