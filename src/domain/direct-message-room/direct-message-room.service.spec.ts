import { DataSource, Repository } from 'typeorm';
import { DirectMessageRoomService } from './direct-message-room.service';
import { DirectMessageRoom } from './direct-message-room.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { DirectMessageRoomModule } from './direct-message-room.module';
import { DirectMessageRoomTestService } from './test/direct-message-room.test.service';
import { DirectMessageRoomTestModule } from './test/direct-message-room.test.module';
import { GetDirectMessageRoomsDto } from './dto/get.direct-message-rooms.dto';
import { DeleteDirectMessageRoomDto } from './dto/delete.direct-message-room.dto';
import { GetDirectMessageRoomsNotificationDto } from './dto/get.direct-message-rooms.notification.dto';
import { DirectMessageRoomsDto } from './dto/direct-message-rooms.dto';
import { DirectMessageRoomsNotificationDto } from './dto/direct-message-rooms.notification.dto';
import { FriendTestService } from '../friend/test/friend.test.service';
import { DirectMessageTestService } from '../direct-message/test/direct-message.test.service';
import { DirectMessageTestModule } from '../direct-message/test/direct-message.test.module';
import { FriendTestModule } from '../friend/test/friend.test.module';

describe('Direct Message Room Service', () => {
  let service: DirectMessageRoomService;
  let friendTestService: FriendTestService;
  let directMessageTestService: DirectMessageTestService;
  let directMessageRoomTestService: DirectMessageRoomTestService;
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
        DirectMessageRoomTestModule,
        DirectMessageTestModule,
        FriendTestModule,
      ],
    }).compile();

    service = module.get<DirectMessageRoomService>(DirectMessageRoomService);
    friendTestService = module.get<FriendTestService>(FriendTestService);
    directMessageTestService = module.get<DirectMessageTestService>(
      DirectMessageTestService,
    );
    directMessageRoomTestService = module.get<DirectMessageRoomTestService>(
      DirectMessageRoomTestService,
    );
    dataSources = module.get<DataSource>(DataSource);
    directMessageRoomRepository = module.get<Repository<DirectMessageRoom>>(
      getRepositoryToken(DirectMessageRoom),
    );
  });

  beforeEach(async () => {
    await friendTestService.createProfileImages();
    await friendTestService.createBasicUsers(3);
    for (let i = 1; i <= 2; i++) {
      await friendTestService.makeFriend(
        friendTestService.users[0],
        friendTestService.users[i],
      );
    }
  });

  afterEach(async () => {
    friendTestService.clear();
    directMessageTestService.clear();
    directMessageRoomTestService.clear();
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
        const user = friendTestService.users[0];

        const friend1 = friendTestService.users[1];
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friend1,
        );
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend1,
          );
        }

        const friend2 = friendTestService.users[2];
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friend2,
        );
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend2,
          );
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
          expect(room.nickname).toBe(friendTestService.users[i + 1].nickname);
          expect(room).toHaveProperty('imgUrl');
          expect(room.imgUrl).toBe(friendTestService.users[i + 1].image.url);
          expect(room).toHaveProperty('newChats');
          expect(room.newChats).toBe(10);
        }
      });

      it('[Valid Case] 진행중인 DM목록이 없을때 확인', async () => {
        const user = friendTestService.users[0];

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
        const user = friendTestService.users[0];

        const friend1 = friendTestService.users[1];
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friend1,
        );
        await directMessageTestService.createDirectMessageFromTo(user, friend1);

        const friend2 = friendTestService.users[2];
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friend2,
        );
        await directMessageTestService.createDirectMessageFromTo(user, friend2);

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
        const user = friendTestService.users[0];

        const friend1 = friendTestService.users[1];
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friend1,
        );
        await directMessageTestService.createDirectMessageFromTo(user, friend1);

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
        const user = friendTestService.users[0];
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
        const user = friendTestService.users[0];

        const friend1 = friendTestService.users[1];
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend1,
          );
        }
        await directMessageRoomTestService.createAllReadDirectMessageRoom(
          user,
          friend1,
        );

        const friend2 = friendTestService.users[2];
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend2,
          );
        }
        await directMessageRoomTestService.createAllReadDirectMessageRoom(
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
        const user = friendTestService.users[0];

        const friend1 = friendTestService.users[1];
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend1,
          );
        }
        await directMessageRoomTestService.createAllReadDirectMessageRoom(
          user,
          friend1,
        );

        const friend2 = friendTestService.users[2];
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend2,
          );
        }
        await directMessageRoomTestService.createHalfReadDirectMessageRoom(
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
