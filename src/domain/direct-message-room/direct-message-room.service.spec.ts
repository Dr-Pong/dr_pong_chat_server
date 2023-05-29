import { DataSource, Repository } from 'typeorm';
import { DirectMessageRoomService } from './direct-message-room.service';
import { DirectMessageRoom } from './direct-message-room.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { FriendDirectMessageModule } from './direct-message-room.module';
import { FriendDirectMessageTestService } from './test/friend-direct-message.test.service';
import { TestModule } from './test/friend-direct-message.test.module';
import { GetDirectMessageRoomsDto } from './dto/get.direct-message-rooms.dto';
import { GetDirectMessageRoomsResponseDto } from './dto/get.direct-message-rooms.response.dto';
import { DeleteDirectMessageRoomDto } from './dto/delete.direct-message-room.dto';
import { GetDirectMessageRoomsNotificationResponseDto } from './dto/get.direct-message-rooms.notification.response.dto';
import { GetDirectMessageRoomsNotificationDto } from './dto/get.direct-message-rooms.notification.dto';

describe('DmLogService', () => {
  let service: DirectMessageRoomService;
  let testData: FriendDirectMessageTestService;
  let dataSources: DataSource;
  let FriendDirectMessageRepository: Repository<DirectMessageRoom>;

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

    service = module.get<DirectMessageRoomService>(DirectMessageRoomService);
    testData = module.get<FriendDirectMessageTestService>(
      FriendDirectMessageTestService,
    );
    dataSources = module.get<DataSource>(DataSource);
    FriendDirectMessageRepository = module.get<Repository<DirectMessageRoom>>(
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
        await testData.createFriendDirectMessage();

        const friendDirectMessageListDto: GetDirectMessageRoomsDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessage: GetDirectMessageRoomsResponseDto =
          await service.getDirectMessageRooms(friendDirectMessageListDto);

        expect(friendDirectMessage).toHaveProperty('chats');
        expect(friendDirectMessage.chats[0]).toHaveProperty('nickname');
        expect(friendDirectMessage.chats[0]).toHaveProperty('imgUrl');
        expect(friendDirectMessage.chats[0]).toHaveProperty('newChat');
      });
      it('[Valid Case] 현재 진행중인 DM목록 반환', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();

        const friendDirectMessageListDto: GetDirectMessageRoomsDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessage: GetDirectMessageRoomsResponseDto =
          await service.getDirectMessageRooms(friendDirectMessageListDto);

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
        const friendDirectMessageListDto: GetDirectMessageRoomsDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessage: GetDirectMessageRoomsResponseDto =
          await service.getDirectMessageRooms(friendDirectMessageListDto);

        expect(friendDirectMessage.chats.length).toBe(0);
      });
    });

    describe('진행중인 DirectMessage 목록 삭제', () => {
      it('[Valid Case] DM 목록에서 삭제', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();

        const friendDirectMessageListDto: DeleteDirectMessageRoomDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.deleteDirectMessageRoom(friendDirectMessageListDto);

        expect(
          await FriendDirectMessageRepository.find({
            where: { userId: { id: testData.users[0].id } },
          }),
        ).toEqual([]);
      });
    });

    describe('진행중인 DirectMessage 알람 받기', () => {
      it('[Valid Case] 대화방의 새로운 알람 수령', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessage();

        const friendDirectMessageNoitceDto: GetFriendDirectMessageNoticeDto = {
          userId: testData.users[0].id,
        };

        const friendDirectMessageNotice: GetDirectMessageRoomsNotificationResponseDto =
          await service.getFriendDirectMessageNotice(
            friendDirectMessageNoitceDto,
          );

        expect(friendDirectMessageNotice).toHaveProperty('hasNewChat');

        expect(friendDirectMessageNotice.hasNewChat).toBe(true);
      });

      it('[Valid Case] 대화방이 없을때', async () => {
        const friendDirectMessageNoitceDto: GetFriendDirectMessageNoticeDto = {
          userId: testData.users[0].id,
        };

        await service.getFriendDirectMessageNotice(
          friendDirectMessageNoitceDto,
        );

        const friendDirectMessageNotice: GetDirectMessageRoomsNotificationResponseDto =
          await service.getFriendDirectMessageNotice(
            friendDirectMessageNoitceDto,
          );

        expect(friendDirectMessageNotice.hasNewChat).toBe(false);
      });

      it('[Valid Case] 대화방의 모든 DM 알람 읽음 (마지막 읽은 메시지 null)', async () => {
        await testData.createDirectMessage(10);
        await testData.createFriendDirectMessageNotice();
        const userId = testData.users[0].id;
        const friendDirectMessageNoticeDto: GetDirectMessageRoomsNotificationDto =
          {
            userId,
          };

        // 알림이 있는지 확인
        let friendDirectMessageNotice: GetDirectMessageRoomsNotificationResponseDto =
          await service.getDirectMessageRoomsNotification(
            friendDirectMessageNoticeDto,
          );
        expect(friendDirectMessageNotice.hasNewChat).toBe(true);

        // 알림을 읽음 처리
        await testData.markAllMessagesAsRead(userId);

        // 알림이 없는지 확인
        friendDirectMessageNotice =
          await service.getDirectMessageRoomsNotification(
            friendDirectMessageNoticeDto,
          );
        expect(friendDirectMessageNotice.hasNewChat).toBe(false);
      });

      it('[Valid Case] 대화방의 모든 DM 알람 안 읽음 (마지막 읽은 메시지가 있을 때)', async () => {
        await testData.createFriendDirectMessageNotice();
        const userId = testData.users[0].id;
        const lastMessageId = testData.friendDirectMessage[0].id;
        const friendDirectMessageNoticeDto: GetDirectMessageRoomsNotificationDto =
          {
            userId,
          };

        // 알림이 있는지 확인
        let friendDirectMessageNotice: GetDirectMessageRoomsNotificationResponseDto =
          await service.getDirectMessageRoomsNotification(
            friendDirectMessageNoticeDto,
          );
        expect(friendDirectMessageNotice.hasNewChat).toBe(true);

        // 마지막 읽은 메시지를 설정
        await FriendDirectMessageRepository.update(
          { userId: { id: testData.users[0].id } },
          { lastReadMessageId: lastMessageId },
        );

        // 알림이 있는지 확인
        friendDirectMessageNotice =
          await service.getDirectMessageRoomsNotification(
            friendDirectMessageNoticeDto,
          );
        expect(friendDirectMessageNotice.hasNewChat).toBe(true);
      });
    });
  });
});
