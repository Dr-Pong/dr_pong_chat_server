import { DataSource, Not, Repository } from 'typeorm';
import { FriendService } from './friend.service';
import { FriendTestService } from './test/friend.test.service';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { TestModule } from './test/friend.test.module';
import { Test, TestingModule } from '@nestjs/testing';
import { GetUserFriendDto as GetUserFriendDto } from './dto/get.user.friend.dto';
import { UserFriendsDto } from './dto/user.friends.dto';
import { Friend } from './friend.entity';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';
import { GetUserPendingFriendDto } from './dto/get.user.peding.friend.dto';
import { UserPendingFriendsDto } from './dto/user.pending.friends.dto';
import { PostUserFriendAcceptDto } from './dto/post.user.friend.accept.dto';
import { DeleteUserFriendRejectDto } from './dto/delete.user.friend.reject.dto';
import { PostUserFriendRequestDto } from './dto/post.user.friend.request.dto';
import { DeleteUserFriendDto } from './dto/delete.user.friend.dto';
import { FriendModule } from './friend.module';

describe('FriendService', () => {
  let service: FriendService;
  let testData: FriendTestService;
  let dataSources: DataSource;
  let friendRepository: Repository<Friend>;

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
        FriendModule,
        TestModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(Friend),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);
    testData = module.get<FriendTestService>(FriendTestService);
    dataSources = module.get<DataSource>(DataSource);
    friendRepository = module.get<Repository<Friend>>(
      getRepositoryToken(Friend),
    );
  });

  beforeEach(async () => {
    await testData.createProfileImages();
    await testData.createBasicUsers(20);
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

  describe('친구관련 Service Logic', () => {
    describe('친구목록 조회', () => {
      it('[Valid Case]친구목록 조회(친구추가 하거나 받은경우)', async () => {
        await testData.createUserFriends(10);
        await testData.createUser0ToFriends(11);
        await testData.createUser0ToFriends(12);

        const userFriendsDto: GetUserFriendDto = {
          userId: testData.users[0].id,
        };
        const FriendsList: UserFriendsDto = await service.getUserFriends(
          userFriendsDto,
        );
        const friendRequest = await friendRepository.find({
          where: {
            sender: { id: testData.users[0].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(FriendsList.friends[0]).toHaveProperty('nickname');
        expect(FriendsList.friends[0]).toHaveProperty('imgUrl');
        expect(friendRequest[0].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[1].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[2].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[3].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[4].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[8].status).toBe(FRIENDSTATUS_FRIEND);
        expect(FriendsList.friends.length).toBe(11);
        expect(FriendsList.friends[0].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(FriendsList.friends[0].imgUrl).toBe(testData.users[1].image.url);
      });

      it('[Valid Case]친구가 없는경우', async () => {
        const userFriendsDto: GetUserFriendDto = {
          userId: testData.users[0].id,
        };
        const FriendsList = await service.getUserFriends(userFriendsDto);

        expect(FriendsList.friends.length).toBe(0);
      });

      it('[Valid Case]반환된 친구 목록이 알파벳순서로 정렬되는지 확인', async () => {
        await testData.createReverseUserFriends();
        const userFriendsDto: GetUserFriendDto = {
          userId: testData.users[0].id,
        };
        const friendsList = await service.getUserFriends(userFriendsDto);

        expect(friendsList.friends.length).toBe(9);
        expect(friendsList.friends[0].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(friendsList.friends[0].imgUrl).toBe(testData.users[1].image.url);
        expect(friendsList.friends[1].nickname).toBe(
          testData.users[2].nickname,
        );
        expect(friendsList.friends[1].imgUrl).toBe(testData.users[2].image.url);
      });
    });
    describe('친구요청', () => {
      it('[Valid Case]유효한 닉네임 친구요청', async () => {
        const userFriendsRequestDto: PostUserFriendRequestDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postUserFriendRequest(userFriendsRequestDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_REQUESTING);
      });

      it('[Valid Case]이미 친구인 유저에게 친구요청(백에서 씹기)', async () => {
        await testData.createUserFriends(10);
        const userFriendsRequestDto: PostUserFriendRequestDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postUserFriendRequest(userFriendsRequestDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });
    });
    describe('친구요청 목록', () => {
      it('[Valid Case] 친구요청이 없는경우 빈목록', async () => {
        const userFriendsRequestDto: GetUserPendingFriendDto = {
          userId: testData.users[0].id,
        };

        const FriendsList = await service.getUserPendingFriendRequests(
          userFriendsRequestDto,
        );

        expect(FriendsList.friends).toHaveLength(0);
      });

      it('[Valid Case] 친구요청 목록이 정상적으로 반환 되는지 확인', async () => {
        await testData.createUserRequesting(10);

        const userFriendsRequestDto: GetUserPendingFriendDto = {
          userId: testData.users[0].id,
        };

        const FriendsList: UserPendingFriendsDto =
          await service.getUserPendingFriendRequests(userFriendsRequestDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(FriendsList.friends[0]).toHaveProperty('nickname');
        expect(FriendsList.friends[0]).toHaveProperty('imgUrl');

        expect(friendRequest.status).toBe(FRIENDSTATUS_REQUESTING);

        // 리스트 반환시 친구요청 상태인지 확인
        expect(FriendsList.friends[0].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(FriendsList.friends[0].imgUrl).toBe(testData.users[1].image.url);

        expect(FriendsList.friends[1].nickname).toBe(
          testData.users[2].nickname,
        );
        expect(FriendsList.friends[1].imgUrl).toBe(testData.users[2].image.url);
      });

      it('[Valid Case] 친구요청 목록이 알파벳순서로 정렬되는지 확인', async () => {
        await testData.createUserRequesting(10);
        await testData.createUser0ToRequesting(14); // 친구 테이블 1에 있어야해요
        await testData.createUser0ToRequesting(15); //친구 테이블 2에 있어야해요

        const userFriendsRequestDto: GetUserPendingFriendDto = {
          userId: testData.users[0].id,
        };

        const FriendsList: UserPendingFriendsDto =
          await service.getUserPendingFriendRequests(userFriendsRequestDto);

        expect(FriendsList.friends.length).toBe(11);
        expect(FriendsList.friends[0].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(FriendsList.friends[0].imgUrl).toBe(testData.users[1].image.url);
        expect(FriendsList.friends[1].nickname).toBe(
          testData.users[14].nickname,
        );
        expect(FriendsList.friends[1].imgUrl).toBe(
          testData.users[14].image.url,
        );
        expect(FriendsList.friends[2].nickname).toBe(
          testData.users[15].nickname,
        );
        expect(FriendsList.friends[2].imgUrl).toBe(
          testData.users[15].image.url,
        );
      });
    });
    describe('친구요청 수락', () => {
      it('[Valid Case]유효한 친구요청 수락', async () => {
        await testData.createUserRequesting(10);

        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await await service.postUserFriendAccept(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });

      it('[Valid Case] 양쪽에서 친구 요청 보낸경우', async () => {
        await testData.createUserRequesting(10);
        await testData.createUser0ToRequesting(1);

        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await await service.postUserFriendAccept(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });
        const anotherFriendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[1].id },
            receiver: { id: testData.users[0].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
        expect(anotherFriendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });

      it('[Valid Case]이미 친구인 유저에게 친구요청 수락(백에서 씹기)', async () => {
        await testData.createUserFriends(10);
        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await await service.postUserFriendAccept(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });
    });
    describe('친구요청 거절', () => {
      it('[Valid Case]친구요청 거절', async () => {
        await testData.createUserRequesting(10);

        const userFriendsAcceptDto: DeleteUserFriendRejectDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.deleteUserFriendReject(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_DELETED);
      });

      it('[Valid Case] 이미 친구인 사용자에게 친구요청 거절(백에서 씹기)', async () => {
        await testData.createUserFriends(10);

        const userFriendsAcceptDto: DeleteUserFriendRejectDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.deleteUserFriendReject(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });
    });
    describe('친구 삭제', () => {
      it('[Valid Case]친구삭제', async () => {
        await testData.createUserFriends(10);

        const userFriendsAcceptDto: DeleteUserFriendDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.deleteUserFriend(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[1].id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_DELETED);
      });

      it('[Valid Case]친구가 아닌 사용자 삭제(백에서 씹기)', async () => {
        const userFriendsAcceptDto: DeleteUserFriendDto = {
          userId: testData.users[0].id,
          friendId: testData.users[3].id,
        };

        await service.deleteUserFriend(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: testData.users[0].id },
            receiver: { id: testData.users[3].id },
          },
        });

        expect(friendRequest).toBeNull();
      });
    });
  });
});
