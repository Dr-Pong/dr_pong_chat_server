import { DataSource, Repository } from 'typeorm';
import { DirectMessageRoomService } from '../../../domain/direct-message-room/direct-message-room.service';
import { DirectMessageRoom } from '../../../domain/direct-message-room/direct-message-room.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { DirectMessageRoomModule } from '../../../domain/direct-message-room/direct-message-room.module';
import { DirectMessageRoomTestData } from '../../data/direct-message-room.test.data';
import { GetDirectMessageRoomsDto } from '../../../domain/direct-message-room/dto/get.direct-message-rooms.dto';
import { DeleteDirectMessageRoomDto } from '../../../domain/direct-message-room/dto/delete.direct-message-room.dto';
import { GetDirectMessageRoomsNotificationDto } from '../../../domain/direct-message-room/dto/get.direct-message-rooms.notification.dto';
import { DirectMessageRoomsDto } from '../../../domain/direct-message-room/dto/direct-message-rooms.dto';
import { DirectMessageRoomsNotificationDto } from '../../../domain/direct-message-room/dto/direct-message-rooms.notification.dto';
import { FriendTestData } from '../../data/friend.test.data';
import { DirectMessageTestData } from '../../data/direct-message.test.data';
import { UserTestData } from 'src/test/data/user.test.data';
import { TestDataModule } from 'src/test/data/test.data.module';

describe('Direct Message Room Service', () => {
  let service: DirectMessageRoomService;
  let userData: UserTestData;
  let friendData: FriendTestData;
  let directMessageData: DirectMessageTestData;
  let directMessageRoomData: DirectMessageRoomTestData;
  let dataSources: DataSource;
  let directMessageRoomRepository: Repository<DirectMessageRoom>;

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
        DirectMessageRoomModule,
        TestDataModule,
      ],
    }).compile();

    service = module.get<DirectMessageRoomService>(DirectMessageRoomService);
    userData = module.get<UserTestData>(UserTestData);
    friendData = module.get<FriendTestData>(FriendTestData);
    directMessageData = module.get<DirectMessageTestData>(
      DirectMessageTestData,
    );
    directMessageRoomData = module.get<DirectMessageRoomTestData>(
      DirectMessageRoomTestData,
    );
    dataSources = module.get<DataSource>(DataSource);
    directMessageRoomRepository = module.get<Repository<DirectMessageRoom>>(
      getRepositoryToken(DirectMessageRoom),
    );
  });

  beforeEach(async () => {
    await userData.createBasicUsers(3);
    for (let i = 1; i <= 2; i++) {
      await friendData.makeFriend(userData.users[0], userData.users[i]);
    }
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
  describe('Direct Message Room Service Logic', () => {
    describe('진행중인 DirectMessageRoom 목록 조회', () => {
      it('[Valid Case] 진행중인 DM 목록 정상 반환', async () => {
        const user = userData.users[0];

        const friend1 = userData.users[1];
        await directMessageRoomData.createEmptyDirectMessageRoom(user, friend1);
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend1);
        }

        const friend2 = userData.users[2];
        await directMessageRoomData.createEmptyDirectMessageRoom(user, friend2);
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend2);
        }

        const directMessageRoomsDto: GetDirectMessageRoomsDto = {
          userId: user.id,
        };

        const directMessageRooms: DirectMessageRoomsDto =
          await service.getAllDirectMessageRooms(directMessageRoomsDto);

        expect(directMessageRooms).toHaveProperty('chatList');
        expect(directMessageRooms.chatList.length).toBe(2);
        for (let i = 0; i < directMessageRooms.chatList.length; i++) {
          const room = directMessageRooms.chatList[i];
          expect(room).toHaveProperty('nickname');
          expect(room.nickname).toBe(userData.users[i + 1].nickname);
          expect(room).toHaveProperty('imgUrl');
          expect(room.imgUrl).toBe(userData.users[i + 1].image.url);
          expect(room).toHaveProperty('newChats');
          expect(room.newChats).toBe(10);
        }
      });

      it('[Valid Case] 진행중인 DM목록이 없을때 확인', async () => {
        const user = userData.users[0];

        const directMessageRoomsDto: GetDirectMessageRoomsDto = {
          userId: user.id,
        };

        const directMessageRooms: DirectMessageRoomsDto =
          await service.getAllDirectMessageRooms(directMessageRoomsDto);

        expect(directMessageRooms.chatList.length).toBe(0);
      });
    });

    describe('진행중인 DirectMessage 목록 삭제', () => {
      it('[Valid Case] DM 목록에서 삭제', async () => {
        const user = userData.users[0];

        const friend1 = userData.users[1];
        await directMessageRoomData.createEmptyDirectMessageRoom(user, friend1);
        await directMessageData.createDirectMessageFromTo(user, friend1);

        const friend2 = userData.users[2];
        await directMessageRoomData.createEmptyDirectMessageRoom(user, friend2);
        await directMessageData.createDirectMessageFromTo(user, friend2);

        const deleteDirectMessageRoomDto: DeleteDirectMessageRoomDto = {
          userId: user.id,
          friendId: friend1.id,
        };

        await service.deleteDirectMessageRoom(deleteDirectMessageRoomDto);

        const directMessageRooms = await directMessageRoomRepository.find({
          where: {
            user: { id: user.id },
            isDisplay: true,
          },
        });
        expect(directMessageRooms.length).toBe(1);
        expect(directMessageRooms[0].friend.id).toBe(friend2.id);
      });
    });

    describe('진행중인 DirectMessage 알람 받기', () => {
      it('[Valid Case] 대화방의 새로운 알람 수령', async () => {
        const user = userData.users[0];

        const friend1 = userData.users[1];
        await directMessageRoomData.createEmptyDirectMessageRoom(user, friend1);
        await directMessageData.createDirectMessageFromTo(user, friend1);

        const getDirectMessageRoomsNotificationDto: GetDirectMessageRoomsNotificationDto =
          {
            userId: user.id,
          };

        const getDirectMessageRoomsNotificationResponse: DirectMessageRoomsNotificationDto =
          await service.getDirectMessageRoomsNotification(
            getDirectMessageRoomsNotificationDto,
          );

        expect(getDirectMessageRoomsNotificationResponse).toHaveProperty(
          'hasNewChat',
        );
        expect(getDirectMessageRoomsNotificationResponse.hasNewChat).toBe(true);
      });

      it('[Valid Case] 대화방이 없을때', async () => {
        const user = userData.users[0];
        const getDirectMessageRoomsNotificationDto: GetDirectMessageRoomsNotificationDto =
          {
            userId: user.id,
          };

        const getDirectMessageRoomsNotificationResponse: DirectMessageRoomsNotificationDto =
          await service.getDirectMessageRoomsNotification(
            getDirectMessageRoomsNotificationDto,
          );

        expect(getDirectMessageRoomsNotificationResponse).toHaveProperty(
          'hasNewChat',
        );
        expect(getDirectMessageRoomsNotificationResponse.hasNewChat).toBe(
          false,
        );
      });

      it('[Valid Case] 대화방의 모든 DM 알람 읽음 ', async () => {
        const user = userData.users[0];

        const friend1 = userData.users[1];
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend1);
        }
        await directMessageRoomData.createAllReadDirectMessageRoom(
          user,
          friend1,
        );

        const friend2 = userData.users[2];
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend2);
        }
        await directMessageRoomData.createAllReadDirectMessageRoom(
          user,
          friend2,
        );

        const getDirectMessageRoomsNotificationDto: GetDirectMessageRoomsNotificationDto =
          {
            userId: user.id,
          };

        const getDirectMessageRoomsNotificationResponse: DirectMessageRoomsNotificationDto =
          await service.getDirectMessageRoomsNotification(
            getDirectMessageRoomsNotificationDto,
          );

        expect(getDirectMessageRoomsNotificationResponse).toHaveProperty(
          'hasNewChat',
        );
        expect(getDirectMessageRoomsNotificationResponse.hasNewChat).toBe(
          false,
        );
      });

      it('[Valid Case] 대화방의 모든 DM 알람 안 읽음 ', async () => {
        const user = userData.users[0];

        const friend1 = userData.users[1];
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend1);
        }
        await directMessageRoomData.createAllReadDirectMessageRoom(
          user,
          friend1,
        );

        const friend2 = userData.users[2];
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend2);
        }
        await directMessageRoomData.createHalfReadDirectMessageRoom(
          user,
          friend2,
        );

        const getDirectMessageRoomsNotificationDto: GetDirectMessageRoomsNotificationDto =
          {
            userId: user.id,
          };

        const getDirectMessageRoomsNotificationResponse: DirectMessageRoomsNotificationDto =
          await service.getDirectMessageRoomsNotification(
            getDirectMessageRoomsNotificationDto,
          );

        expect(getDirectMessageRoomsNotificationResponse).toHaveProperty(
          'hasNewChat',
        );
        expect(getDirectMessageRoomsNotificationResponse.hasNewChat).toBe(true);
      });
    });
  });
});
