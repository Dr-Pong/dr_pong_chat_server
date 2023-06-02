import { DataSource, Repository } from 'typeorm';
import { DirectMessageRoomService } from './direct-message-room.service';
import { DirectMessageRoom } from './direct-message-room.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DirectMessageRoomModule } from './direct-message-room.module';
import { FriendDirectMessageTestService } from './test/direct-message-room.test.service';
import { TestModule } from './test/direct-message-room.test.module';
import { GetDirectMessageRoomsDto } from './dto/get.direct-message-rooms.dto';
import { DeleteDirectMessageRoomDto } from './dto/delete.direct-message-room.dto';
import { GetDirectMessageRoomsNotificationDto } from './dto/get.direct-message-rooms.notification.dto';
import { DirectMessageRoomsDto } from './dto/direct-message-rooms.dto';
import { DirectMessageRoomsNotificationDto } from './dto/direct-message-rooms.notification.dto';

describe('DmLogService', () => {
  let service: DirectMessageRoomService;
  let testData: FriendDirectMessageTestService;
  let dataSources: DataSource;
  let directMessageRoomRepository: Repository<DirectMessageRoom>;

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
        DirectMessageRoomModule,
        TestModule,
      ],
    }).compile();

    service = module.get<DirectMessageRoomService>(DirectMessageRoomService);
    testData = module.get<FriendDirectMessageTestService>(
      FriendDirectMessageTestService,
    );
    dataSources = module.get<DataSource>(DataSource);
    directMessageRoomRepository = module.get<Repository<DirectMessageRoom>>(
      getRepositoryToken(DirectMessageRoom),
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
  describe('Direct Message Room Service Logic', () => {
    describe('진행중인 DirectMessageRoom 목록 조회', () => {
      it('[Valid Case] 대화방의 형식 확인 (이미지, 닉네임, 새채팅의 수)', async () => {
        await testData.createDirectMessage(10);
        await testData.createDirectMessageRooms();

        const directMessageRoomsDto: GetDirectMessageRoomsDto = {
          userId: testData.users[0].id,
        };

        const directMessageRooms: DirectMessageRoomsDto =
          await service.getDirectMessageRooms(directMessageRoomsDto);

        expect(directMessageRooms).toHaveProperty('chats');
        expect(directMessageRooms.chats[0]).toHaveProperty('nickname');
        expect(directMessageRooms.chats[0]).toHaveProperty('imgUrl');
        expect(directMessageRooms.chats[0]).toHaveProperty('newChat');
      });

      it('[Valid Case] 현재 진행중인 DM목록 반환', async () => {
        await testData.createDirectMessage(10);
        await testData.createDirectMessageRooms();

        const directMessageRoomsDto: GetDirectMessageRoomsDto = {
          userId: testData.users[0].id,
        };

        const directMessageRooms: DirectMessageRoomsDto =
          await service.getDirectMessageRooms(directMessageRoomsDto);

        expect(directMessageRooms.chats.length).toBe(10);

        expect(directMessageRooms.chats[0].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(directMessageRooms.chats[0].imgUrl).toBe(
          testData.users[1].image,
        );
        expect(directMessageRooms.chats[0].newChat).toBe(0);
      });

      it('[Valid Case] 진행중인 DM목록이 없을때 확인', async () => {
        const directMessageRoomsDto: GetDirectMessageRoomsDto = {
          userId: testData.users[0].id,
        };

        const directMessageRooms: DirectMessageRoomsDto =
          await service.getDirectMessageRooms(directMessageRoomsDto);

        expect(directMessageRooms.chats.length).toBe(0);
      });
    });

    describe('진행중인 DirectMessage 목록 삭제', () => {
      it('[Valid Case] DM 목록에서 삭제', async () => {
        await testData.createDirectMessage(10);
        await testData.createDirectMessageRooms();

        const deleteDirectMessageRoomDto: DeleteDirectMessageRoomDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.deleteDirectMessageRoom(deleteDirectMessageRoomDto);

        expect(
          await directMessageRoomRepository.find({
            where: {
              userId: { id: testData.users[0].id },
              isDisplay: true,
            },
          }),
        ).toHaveLength(9);
      });
    });

    describe('진행중인 DirectMessage 알람 받기', () => {
      it('[Valid Case] 대화방의 새로운 알람 수령', async () => {
        await testData.createDirectMessage(10);
        await testData.createDirectMessageRooms();

        const getDirectMessageRoomsNotificationDto: GetDirectMessageRoomsNotificationDto =
          {
            userId: testData.users[0].id,
          };

        const getDirectMessageRoomsNotificationResponse: DirectMessageRoomsNotificationDto =
          await service.getDirectMessageRoomsNotification(
            getDirectMessageRoomsNotificationDto,
          );

        expect(getDirectMessageRoomsNotificationResponse).toHaveProperty(
          'hasNewChat',
        );
        expect(getDirectMessageRoomsNotificationResponse.hasNewChat).toBe(
          'true',
        );
      });

      it('[Valid Case] 대화방이 없을때', async () => {
        const getDirectMessageRoomsNotificationDto: GetDirectMessageRoomsNotificationDto =
          {
            userId: testData.users[0].id,
          };

        const getDirectMessageRoomsNotificationResponse: DirectMessageRoomsNotificationDto =
          await service.getDirectMessageRoomsNotification(
            getDirectMessageRoomsNotificationDto,
          );

        expect(getDirectMessageRoomsNotificationResponse).toHaveProperty(
          'hasNewChat',
        );
        expect(getDirectMessageRoomsNotificationResponse.hasNewChat).toBe(
          'false',
        );
      });

      it('[Valid Case] 대화방의 모든 DM 알람 읽음 ', async () => {
        await testData.createDirectMessage(10);
        await testData.createDirectMessageRooms();

        const getDirectMessageRoomsNotificationDto: GetDirectMessageRoomsNotificationDto =
          {
            userId: testData.users[0].id,
          };

        const getDirectMessageRoomsNotificationResponse: DirectMessageRoomsNotificationDto =
          await service.getDirectMessageRoomsNotification(
            getDirectMessageRoomsNotificationDto,
          );

        expect(getDirectMessageRoomsNotificationResponse).toHaveProperty(
          'hasNewChat',
        );
        expect(getDirectMessageRoomsNotificationResponse.hasNewChat).toBe(
          'true',
        );
      });

      it('[Valid Case] 대화방의 모든 DM 알람 안 읽음 ', async () => {
        await testData.createDirectMessage(10);
        await testData.createHalfReadDirectMessageRooms();

        const getDirectMessageRoomsNotificationDto: GetDirectMessageRoomsNotificationDto =
          {
            userId: testData.users[0].id,
          };

        const getDirectMessageRoomsNotificationResponse: DirectMessageRoomsNotificationDto =
          await service.getDirectMessageRoomsNotification(
            getDirectMessageRoomsNotificationDto,
          );

        expect(getDirectMessageRoomsNotificationResponse).toHaveProperty(
          'hasNewChat',
        );
        expect(getDirectMessageRoomsNotificationResponse.hasNewChat).toBe(
          'false',
        );
      });
    });
  });
});