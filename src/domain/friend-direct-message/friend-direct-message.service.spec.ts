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
import { GetFriendDirectMessageDto } from './dto/get.friend-direct-message.dto';
import { GetFriendDirectMessageResponseDto } from './dto/get.friend-direct-message.response.dto';
import { DeleteFriendDirectMessageDto } from './dto/delete.friend-direct-message.dto';

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
      it('[Valid Case] 대화방의 형식 확인 (이미지, 닉네임, 새채팅의 수)', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();

        const friendDirectMessageListDto: GetFriendDirectMessageDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessage: GetFriendDirectMessageResponseDto =
          await service.getFriendDirectMessage(friendDirectMessageListDto);

        expect(friendDirectMessage).toHaveProperty('chats');
        expect(friendDirectMessage.chats[0]).toHaveProperty('nickname');
        expect(friendDirectMessage.chats[0]).toHaveProperty('imgUrl');
        expect(friendDirectMessage.chats[0]).toHaveProperty('newChat');
      });
      it('[Valid Case] 현재 진행중인 DM목록 반환', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();

        const friendDirectMessageListDto: GetFriendDirectMessageDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessage: GetFriendDirectMessageResponseDto =
          await service.getFriendDirectMessage(friendDirectMessageListDto);

        expect(friendDirectMessage.chats.length).toBe(10);

        expect(friendDirectMessage.chats[0].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(friendDirectMessage.chats[0].imgUrl).toBe(
          testData.users[1].image,
        );
        expect(friendDirectMessage.chats[0].newChat).toBe(0);
      });

      it('[Valid Case] 진행중인 DM목록이 없을때 확인', async () => {
        const friendDirectMessageListDto: GetFriendDirectMessageDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessage: GetFriendDirectMessageResponseDto =
          await service.getFriendDirectMessage(friendDirectMessageListDto);

        expect(friendDirectMessage.chats.length).toBe(0);
      });

      it('[Valid Case]내가 친구 삭제, 차단시 DM이 목록에 없는지 조회', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();
        await testData.deleteFriend();

        const friendDirectMessageListDto: GetFriendDirectMessageDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessage: GetFriendDirectMessageResponseDto =
          await service.getFriendDirectMessage(friendDirectMessageListDto);

        expect(friendDirectMessage.chats.length).toBe(0);
      });

      it('[Valid Case] 내가 친구 삭제, 차단 당했을때 DM 목록에 있는지 조회', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();
        await testData.deleteFriend();

        const friendDirectMessageListDto: GetFriendDirectMessageDto = {
          userId: testData.users[1].id,
        };

        const friendDirectMessage: GetFriendDirectMessageResponseDto =
          await service.getFriendDirectMessage(friendDirectMessageListDto);

        expect(friendDirectMessage.chats.length).toBe(0);
      });
    });

    describe('진행중인 DirectMessage 목록 삭제', () => {
      it('[Valid Case] DM 목록에서 삭제', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();

        const friendDirectMessageListDto: DeleteFriendDirectMessageDto = {
          userId: testData.users[0].id,
        };

        await service.deleteFriendDirectMessage(friendDirectMessageListDto);

        expect(
          await FriendDirectMessageRepository.find({
            where: { userId: { id: testData.users[0].id } },
          }),
        ).toEqual([]);
      });
      it('[유효한 경우] DM 목록에서 삭제 후 다시 DM 입력하여 목록 반환해보기', async () => {
        const friendDirectMessageListDto: DeleteFriendDirectMessageDto = {
          userId: testData.users[0].id,
        };

        await service.deleteFriendDirectMessage(friendDirectMessageListDto);

        expect(
          await FriendDirectMessageRepository.find({
            where: { userId: { id: testData.users[0].id } },
          }),
        ).toEqual([]);

        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();

        const newFriendDirectMessageListDto: GetFriendDirectMessageDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessage: GetFriendDirectMessageResponseDto =
          await service.getFriendDirectMessage(newFriendDirectMessageListDto);

        expect(friendDirectMessage.chats.length).toBe(10);
      });
    });

    describe('진행중인 DirectMessage 알람 받기', () => {
      it('[Valid Case] 대화방의 알람수령', async () => {});
      it('[Valid Case] 새로온 DM 의 수 반환', async () => {});
    });
  });
});
