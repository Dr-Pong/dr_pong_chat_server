import { Test, TestingModule } from '@nestjs/testing';
import { DirectMessageService } from '../../../domain/direct-message/direct-message.service';
import { DirectMessageTestData } from '../../data/direct-message.test.data';
import { DataSource, Repository } from 'typeorm';
import { DirectMessage } from '../../../domain/direct-message/direct-message.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { DirectMessageModule } from '../../../domain/direct-message/direct-message.module';
import { PostDirectMessageDto } from '../../../domain/direct-message/dto/post.direct-message.dto';
import { GetDirectMessageHistoryDto } from '../../../domain/direct-message/dto/get.direct-message.history.dto';
import { GetDirectMessageHistoryResponseDto } from '../../../domain/direct-message/dto/get.direct-message.history.response.dto';
import { DirectMessageRoomModule } from '../../../domain/direct-message-room/direct-message-room.module';
import { DirectMessageRoom } from '../../../domain/direct-message-room/direct-message-room.entity';
import { CHATTYPE_ME, CHATTYPE_OTHERS } from 'src/global/type/type.chat';
import { BadRequestException } from '@nestjs/common';
import { FriendTestData } from '../../data/friend.test.data';
import { DirectMessageRoomTestData } from '../../data/direct-message-room.test.data';
import { TestDataModule } from 'src/test/data/test.data.module';
import { UserTestData } from 'src/test/data/user.test.data';

describe('Direct Message Service', () => {
  let service: DirectMessageService;
  let userData: UserTestData;
  let friendData: FriendTestData;
  let directMessageData: DirectMessageTestData;
  let directMessageRoomData: DirectMessageRoomTestData;
  let dataSources: DataSource;
  let directMessageRepository: Repository<DirectMessage>;
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
        DirectMessageModule,
        DirectMessageRoomModule,
        TestDataModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(DirectMessage),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<DirectMessageService>(DirectMessageService);
    userData = module.get<UserTestData>(UserTestData);
    directMessageData = module.get<DirectMessageTestData>(
      DirectMessageTestData,
    );
    friendData = module.get<FriendTestData>(FriendTestData);
    directMessageRoomData = module.get<DirectMessageRoomTestData>(
      DirectMessageRoomTestData,
    );
    dataSources = module.get<DataSource>(DataSource);
    directMessageRepository = module.get<Repository<DirectMessage>>(
      getRepositoryToken(DirectMessage),
    );
    directMessageRoomRepository = module.get<Repository<DirectMessageRoom>>(
      getRepositoryToken(DirectMessageRoom),
    );
  });

  beforeEach(async () => {
    await userData.createBasicUsers(3);
    await friendData.makeFriend(userData.users[0], userData.users[1]);
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

  describe('Direct Message Service Logic', () => {
    describe('Direct Message 대화 내역 조회', () => {
      it('[Valid Case] 대화 내역 정상 조회', async () => {
        const user = userData.users[0];
        const friend = userData.users[1];
        for (let i = 0; i < 10; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend);
          await directMessageData.createDirectMessageFromTo(friend, user);
        }

        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 2147483647,
          count: 20,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        expect(directMessageHistory).toHaveProperty('chats');
        expect(directMessageHistory.chats.length).toBe(20);
        for (const chat of directMessageHistory.chats) {
          expect(chat).toHaveProperty('id');
          expect(chat).toHaveProperty('nickname');
          expect(chat).toHaveProperty('message');
          expect(chat).toHaveProperty('time');
          expect(chat).toHaveProperty('type');
        }
      });

      it('[Valid Case] 비어있는 대화 내역 조회', async () => {
        const user = userData.users[0];
        const friend = userData.users[1];
        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 2147483647,
          count: 10,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        expect(directMessageHistory.chats.length).toBe(0);
      });

      it('[Valid Case] 유저 두명이서 보내는 경우', async () => {
        const user = userData.users[0];
        const friend = userData.users[1];
        for (let i = 0; i < 20; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend);
          await directMessageData.createDirectMessageFromTo(friend, user);
        }
        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 2147483647,
          count: 40,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        for (const chat of directMessageHistory.chats) {
          expect(chat).toHaveProperty('id');
          expect(chat).toHaveProperty('nickname');
          expect(chat).toHaveProperty('message');
          expect(chat).toHaveProperty('time');
          expect(chat).toHaveProperty('type');
          if (chat.type === CHATTYPE_ME) {
            expect(chat.nickname).toBe(user.nickname);
          } else if (chat.type === CHATTYPE_OTHERS) {
            expect(chat.nickname).toBe(friend.nickname);
          }
        }
      });

      it('[Valid Case] isLastPage 일때', async () => {
        const user = userData.users[0];
        const friend = userData.users[1];
        for (let i = 0; i < 2; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend);
          await directMessageData.createDirectMessageFromTo(friend, user);
        }

        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 2147483647,
          count: 10,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        expect(directMessageHistory.chats.length).toBe(4);
        expect(directMessageHistory.isLastPage).toBe(true);
      });

      it('[Valid Case] isLastPage 일때 특: 카운트랑 딱맞을때', async () => {
        const user = userData.users[0];
        const friend = userData.users[1];
        for (let i = 0; i < 5; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend);
          await directMessageData.createDirectMessageFromTo(friend, user);
        }

        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 2147483647,
          count: 10,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        expect(directMessageHistory.chats.length).toBe(10);
        expect(directMessageHistory.isLastPage).toBe(true);
      });

      it('[Valid Case] isLastPage 아닐때', async () => {
        const user = userData.users[0];
        const friend = userData.users[1];
        for (let i = 0; i < 12; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend);
          await directMessageData.createDirectMessageFromTo(friend, user);
        }

        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 2147483647,
          count: 10,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        expect(directMessageHistory.chats.length).toBe(10);
        expect(directMessageHistory.isLastPage).toBe(false);
      });
    });
    describe('Direct Message 전송', () => {
      it('[Valid Case] DM 전송(처음전송)', async () => {
        const user = userData.users[0];
        const friend = userData.users[1];
        const roomId = `${user.id}+${friend.id}`;

        const userDirectMessageDto: PostDirectMessageDto = {
          userId: user.id,
          friendId: friend.id,
          message: '아아 테스트중log0',
        };

        const beforeDirectMessages: DirectMessage[] =
          await directMessageRepository.find({
            where: {
              roomId: roomId,
            },
          });
        const beforeDirectMessageRooms: DirectMessageRoom[] =
          await directMessageRoomRepository.find({
            where: {
              roomId: roomId,
            },
          });

        expect(beforeDirectMessages.length).toBe(0);
        beforeDirectMessageRooms.forEach((room) => {
          expect(room.isDisplay).toBe(false);
        });

        await service.postDirectMessage(userDirectMessageDto);

        const afterDirectMessages: DirectMessage[] =
          await directMessageRepository.find({
            where: {
              roomId: roomId,
            },
            order: {
              id: 'DESC',
            },
          });
        const afterDirectMessageRooms: DirectMessageRoom[] =
          await directMessageRoomRepository.find({
            where: {
              roomId: roomId,
            },
          });

        expect(afterDirectMessages.length).toBe(1);
        afterDirectMessageRooms.forEach((room) => {
          expect(room.isDisplay).toBe(true);
          if (room.user.id === user.id) {
            expect(room.lastReadMessageId).toBe(afterDirectMessages[0].id);
          }
        });
      });

      it('[Valid Case] DM 전송(있던방에 전송)', async () => {
        const user = userData.users[0];
        const friend = userData.users[1];
        const roomId = `${user.id}+${friend.id}`;
        for (let i = 0; i < 12; i++) {
          await directMessageData.createDirectMessageFromTo(user, friend);
          await directMessageData.createDirectMessageFromTo(friend, user);
        }

        const userDirectMessageDto: PostDirectMessageDto = {
          userId: user.id,
          friendId: friend.id,
          message: '아아 테스트중log0',
        };

        const beforeUsersDirectMessages: DirectMessage[] =
          await directMessageRepository.find({
            where: {
              sender: user,
              roomId: roomId,
            },
            order: {
              id: 'DESC',
            },
          });
        const beforeFriendsDirectMessages: DirectMessage[] =
          await directMessageRepository.find({
            where: {
              sender: friend,
              roomId: roomId,
            },
            order: {
              id: 'DESC',
            },
          });

        const beforeUserDirectMessageRoom: DirectMessageRoom =
          await directMessageRoomRepository.findOne({
            where: {
              user: user,
              roomId: roomId,
            },
          });
        const beforeFriendDirectMessageRoom: DirectMessageRoom =
          await directMessageRoomRepository.findOne({
            where: {
              user: friend,
              roomId: roomId,
            },
          });

        expect(beforeUsersDirectMessages.length).toBe(12);
        expect(beforeFriendsDirectMessages.length).toBe(12);
        expect(beforeUserDirectMessageRoom.isDisplay).toBe(false);
        expect(beforeFriendDirectMessageRoom.isDisplay).toBe(false);
        expect(beforeUserDirectMessageRoom.lastReadMessageId).toBe(null);
        expect(beforeFriendDirectMessageRoom.lastReadMessageId).toBe(null);

        await service.postDirectMessage(userDirectMessageDto);

        const afterDirectMessages: DirectMessage[] =
          await directMessageRepository.find({
            where: {
              roomId: roomId,
            },
            order: {
              id: 'DESC',
            },
          });
        const afterUserDirectMessageRoom: DirectMessageRoom =
          await directMessageRoomRepository.findOne({
            where: {
              roomId: roomId,
            },
          });
        const afterFriendDirectMessageRoom: DirectMessageRoom =
          await directMessageRoomRepository.findOne({
            where: {
              user: friend,
              roomId: roomId,
            },
          });

        expect(afterDirectMessages.length).toBe(25);
        expect(afterUserDirectMessageRoom.isDisplay).toBe(true);
        expect(afterUserDirectMessageRoom.lastReadMessageId).toBe(
          afterDirectMessages[0].id,
        );
        expect(afterFriendDirectMessageRoom.isDisplay).toBe(true);
        expect(afterFriendDirectMessageRoom.lastReadMessageId).toBe(null);
      });

      it('[Valid Case] 친구가 아닌 유저에게 전송이 불가능한지', async () => {
        const user = userData.users[0];
        const notFriend = userData.users[2];
        const userDirectMessageDto: PostDirectMessageDto = {
          userId: user.id,
          friendId: notFriend.id,
          message: '안가야하는log0',
        };

        await expect(
          service.postDirectMessage(userDirectMessageDto),
        ).rejects.toThrow(new BadRequestException('not a friend'));
      });
    });
  });
});
