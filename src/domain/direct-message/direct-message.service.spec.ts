import { Test, TestingModule } from '@nestjs/testing';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageTestService } from './test/direct-message.test.service';
import { DataSource, Repository } from 'typeorm';
import { DirectMessage } from './direct-message.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { DirectMessageModule } from './direct-message.module';
import { DirectMessageTestModule } from './test/direct-message.test.module';
import { PostDirectMessageDto } from './dto/post.direct-message.dto';
import { GetDirectMessageHistoryDto } from './dto/get.direct-message.history.dto';
import { GetDirectMessageHistoryResponseDto } from './dto/get.direct-message.history.response.dto';
import { DirectMessageRoomModule } from '../direct-message-room/direct-message-room.module';
import { DirectMessageRoom } from '../direct-message-room/direct-message-room.entity';
import { CHATTYPE_ME, CHATTYPE_OTHERS } from 'src/global/type/type.chat';
import { BadRequestException } from '@nestjs/common';
import { FriendTestService } from '../friend/test/friend.test.service';
import { FriendTestModule } from '../friend/test/friend.test.module';
import { DirectMessageRoomTestModule } from '../direct-message-room/test/direct-message-room.test.module';
import { DirectMessageRoomTestService } from '../direct-message-room/test/direct-message-room.test.service';

describe('Direct Message Service', () => {
  let service: DirectMessageService;
  let friendTestService: FriendTestService;
  let directMessageTestService: DirectMessageTestService;
  let directMessageRoomTestService: DirectMessageRoomTestService;
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
        DirectMessageTestModule,
        DirectMessageRoomTestModule,
        FriendTestModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(DirectMessage),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<DirectMessageService>(DirectMessageService);
    directMessageTestService = module.get<DirectMessageTestService>(
      DirectMessageTestService,
    );
    friendTestService = module.get<FriendTestService>(FriendTestService);
    directMessageRoomTestService = module.get<DirectMessageRoomTestService>(
      DirectMessageRoomTestService,
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
    await friendTestService.createProfileImages();
    await friendTestService.createBasicUsers(3);
    await friendTestService.makeFriend(
      friendTestService.users[0],
      friendTestService.users[1],
    );
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

  describe('Direct Message Service Logic', () => {
    describe('Direct Message 대화 내역 조회', () => {
      it('[Valid Case] 대화 내역 정상 조회', async () => {
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        for (let i = 0; i < 10; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend,
          );
          await directMessageTestService.createDirectMessageFromTo(
            friend,
            user,
          );
        }

        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: null,
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
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: null,
          count: 10,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        expect(directMessageHistory.chats.length).toBe(0);
      });

      it('[Valid Case] 유저 두명이서 보내는 경우', async () => {
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        for (let i = 0; i < 20; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend,
          );
          await directMessageTestService.createDirectMessageFromTo(
            friend,
            user,
          );
        }
        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: null,
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
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        for (let i = 0; i < 2; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend,
          );
          await directMessageTestService.createDirectMessageFromTo(
            friend,
            user,
          );
        }

        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 0,
          count: 10,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        expect(directMessageHistory.chats.length).toBe(4);
        expect(directMessageHistory.isLastPage).toBe(true);
      });

      it('[Valid Case] isLastPage 일때 특: 카운트랑 딱맞을때', async () => {
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        for (let i = 0; i < 5; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend,
          );
          await directMessageTestService.createDirectMessageFromTo(
            friend,
            user,
          );
        }

        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 0,
          count: 10,
        };

        const directMessageHistory: GetDirectMessageHistoryResponseDto =
          await service.getDirectMessagesHistory(userDirectMessageDto);

        expect(directMessageHistory.chats.length).toBe(10);
        expect(directMessageHistory.isLastPage).toBe(true);
      });

      it('[Valid Case] isLastPage 아닐때', async () => {
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        for (let i = 0; i < 12; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend,
          );
          await directMessageTestService.createDirectMessageFromTo(
            friend,
            user,
          );
        }

        const userDirectMessageDto: GetDirectMessageHistoryDto = {
          userId: user.id,
          friendId: friend.id,
          offset: 0,
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
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
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
        expect(beforeDirectMessageRooms.length).toBe(0);

        await service.postDirectMessage(userDirectMessageDto);

        const afterDirectMessages: DirectMessage[] =
          await directMessageRepository.find({
            where: {
              roomId: roomId,
            },
          });
        const afterDirectMessageRooms: DirectMessageRoom[] =
          await directMessageRoomRepository.find({
            where: {
              roomId: roomId,
            },
          });

        expect(afterDirectMessages.length).toBe(1);
        expect(afterDirectMessageRooms.length).toBe(1);
      });

      it('[Valid Case] DM 전송(있던방에 전송)', async () => {
        const user = friendTestService.users[0];
        const friend = friendTestService.users[1];
        const roomId = `${user.id}+${friend.id}`;
        await directMessageRoomTestService.createEmptyDirectMessageRoom(
          user,
          friend,
        );
        for (let i = 0; i < 12; i++) {
          await directMessageTestService.createDirectMessageFromTo(
            user,
            friend,
          );
          await directMessageTestService.createDirectMessageFromTo(
            friend,
            user,
          );
        }

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

        expect(beforeDirectMessages.length).toBe(24);
        expect(beforeDirectMessageRooms.length).toBe(1);

        await service.postDirectMessage(userDirectMessageDto);

        const afterDirectMessages: DirectMessage[] =
          await directMessageRepository.find({
            where: {
              roomId: roomId,
            },
          });
        const afterDirectMessageRooms: DirectMessageRoom[] =
          await directMessageRoomRepository.find({
            where: {
              roomId: roomId,
            },
          });

        expect(afterDirectMessages.length).toBe(25);
        expect(afterDirectMessageRooms.length).toBe(1);
      });

      it('[Valid Case] 친구가 아닌 유저에게 전송이 불가능한지', async () => {
        const user = friendTestService.users[0];
        const notFriend = friendTestService.users[2];
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
