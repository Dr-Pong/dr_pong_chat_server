import { DataSource, Not, Repository } from 'typeorm';
import { FriendService } from './friend.service';
import { TestService } from './test/test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { FrinedModule } from './frined.module';
import { TestModule } from './test/test.module';
import { Test, TestingModule } from '@nestjs/testing';
import { GetUserFriendDto as GetUserFriendDto } from './dto/get.user.friend.dto';
import { UserFriendsDto } from './dto/user.friends.dto';
import { PostUserFriendRequestDto as PostUserFriendsRequestDto } from './dto/post.user.friend.request.dto';
import { Friend } from './friend.entity';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';
import { GetUserPendingFriendDto } from './dto/get.user.peding.friend.dto';
import { UserPendingFriendsDto } from './dto/user.pending.friends.dto';
import { PostUserFriendAcceptDto } from './dto/post.user.friend.accept.dto';
import { DeleteUserFriendDto } from './dto/delete.user.friend.dto';
import { DeleteUserFriendRejectDto } from './dto/delete.user.friend.reject.dto';

describe('FriendService', () => {
  let service: FriendService;
  let testData: TestService;
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
        FrinedModule,
        TestModule,
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);
    testData = module.get<TestService>(TestService);
    dataSources = module.get<DataSource>(DataSource);
    friendRepository = module.get<Repository<Friend>>(Repository);
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

  describe('친구관련 Service Logic', () => {
    describe('친구목록 조회', () => {
      it('[Valid Case]친구목록 조회', async () => {
        await testData.createUserFriends(10);
        const userFriendsDto: GetUserFriendDto = {
          userId: testData.users[0].id,
        };

        const FriendsList: UserFriendsDto =
          service.getUserFriendsByNickname(userFriendsDto);

        const friendRequest: Friend[] = await friendRepository.find({
          where: {
            user: { id: testData.users[0].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(FriendsList).toBeNull();

        expect(friendRequest[0].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[1].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[2].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[3].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[4].status).toBe(FRIENDSTATUS_FRIEND);
        expect(friendRequest[8].status).toBe(FRIENDSTATUS_FRIEND);

        expect(FriendsList.friends.length).toBe(9);
        expect(FriendsList.friends[0]).toBe(testData.users[1]);
        expect(FriendsList.friends[1]).toBe(testData.users[2]);
        expect(FriendsList.friends[8]).toBe(testData.users[9]);
      });

      it('[Valid Case]친구가 없는경우', async () => {
        const userFriendsDto: GetUserFriendDto = {
          userId: testData.users[0].id,
        };

        const friendsList: UserFriendsDto =
          service.getUserFriendsByNickname(userFriendsDto);

        expect(friendsList).toHaveProperty('users');
        expect(friendsList.friends.length).toBe(0);
        expect(friendsList.friends).toBe([]);
      });

      it('[Valid Case]반환된 친구 목록이 알파벳순서로 정렬되는지 확인', async () => {
        await testData.createUserFriends(10);

        const userFriendsDto: GetUserFriendDto = {
          userId: testData.users[0].id,
        };

        const friendsList: UserFriendsDto =
          service.getUserFriendsByNickname(userFriendsDto);

        expect(friendsList).toBeNull();

        expect(friendsList.friends.length).toBe(9);
        expect(friendsList.friends[0]).toBe(testData.users[1]);
        expect(friendsList.friends[1]).toBe(testData.users[2]);
        expect(friendsList.friends[8]).toBe(testData.users[9]);
      });
    });
    describe('친구요청', () => {
      it('[Valid Case]유효한 닉네임 친구요청', async () => {
        const userFriendsRequestDto: PostUserFriendsRequestDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postUserFriendsRequestByNickname(userFriendsRequestDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_REQUESTING);
      });

      it('[Valid Case]이미 친구인 유저에게 친구요청(백에서 씹기)', async () => {
        await testData.createUserFriends(10);
        const userFriendsRequestDto: PostUserFriendsRequestDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postUserFriendsRequestByNickname(userFriendsRequestDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
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

        const FriendsList: UserPendingFriendsDto =
          service.getUserPendingFriendsRequestByNickname(userFriendsRequestDto);

        expect(FriendsList).toBeNull();
      });

      it('[Valid Case] 친구요청 목록이 정상적으로 반환 되는지 확인', async () => {
        await testData.createUserRequesting();

        const userFriendsRequestDto: GetUserPendingFriendDto = {
          userId: testData.users[0].id,
        };

        const FriendsList: UserPendingFriendsDto =
          service.getUserPendingFriendsRequestByNickname(userFriendsRequestDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(FriendsList).toHaveProperty('users');
        expect(FriendsList.friends).toHaveProperty('nickname');
        expect(FriendsList.friends).toHaveProperty('imgUrl');

        expect(friendRequest.status).toBe(FRIENDSTATUS_REQUESTING);

        // 리스트 반환시 친구요청 상태인지 확인
        expect(FriendsList.friends[0].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(FriendsList.friends[0].imgUrl).toBe(testData.users[1].image);
        expect(FriendsList.friends[1].nickname).toBe(
          testData.users[2].nickname,
        );
        expect(FriendsList.friends[1].imgUrl).toBe(testData.users[2].image);
      });

      it('[Valid Case] 친구요청 목록이 알파벳순서로 정렬되는지 확인', async () => {
        await testData.createUserRequesting();

        const userFriendsRequestDto: GetUserPendingFriendDto = {
          userId: testData.users[0].id,
        };

        const FriendsList: UserPendingFriendsDto =
          service.getUserPendingFriendsRequestByNickname(userFriendsRequestDto);

        expect(FriendsList).toHaveProperty('users');
        expect(FriendsList.friends).toHaveProperty('nickname');
        expect(FriendsList.friends).toHaveProperty('imgUrl');

        expect(Number(FriendsList.friends[0].nickname)).toBeGreaterThan(
          Number(FriendsList.friends[1].nickname),
        );
        expect(Number(FriendsList.friends[1].nickname)).toBeGreaterThan(
          Number(FriendsList.friends[2].nickname),
        );

        // 리스트 반환시 친구요청 상태인지 확인
        expect(FriendsList.friends[0].nickname).toBe(
          testData.users[1].nickname,
        );
        expect(FriendsList.friends[0].imgUrl).toBe(testData.users[1].image);
        expect(FriendsList.friends[1].nickname).toBe(
          testData.users[2].nickname,
        );
        expect(FriendsList.friends[1].imgUrl).toBe(testData.users[2].image);
      });
    });
    describe('친구요청 수락', () => {
      it('[Valid Case]유효한 친구요청 수락', async () => {
        await testData.createUserRequesting();

        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postUserFriendsAcceptByNickname(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });

      it('[Valid Case] 양쪽에서 친구 요청 보낸경우', async () => {
        await testData.createUserRequesting();
        await testData.createAnotherUsersRequesting();

        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postUserFriendsAcceptByNickname(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });
        const anotherFriendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[1].id },
            friend: { id: testData.users[0].id },
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

        await service.postUserFriendsAcceptByNickname(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });
    });
    describe('친구요청 거절', () => {
      it('[Valid Case]친구요청 거절', async () => {
        await testData.createUserRequesting();

        const userFriendsAcceptDto: DeleteUserFriendRejectDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postUserFriendsRejectByNickname(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest).toBeNull();
      });

      it('[Valid Case] 이미 친구인 사용자에게 친구요청 거절(백에서 씹기)', async () => {
        await testData.createUserFriends(10);
        await testData.createUserRequesting();

        const userFriendsAcceptDto: DeleteUserFriendRejectDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.postUserFriendsRejectByNickname(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest).toBeNull();
      });
    });
    describe('친구 삭제', () => {
      it('[Valid Case]친구삭제', async () => {
        await testData.createUserFriends(10);

        const userFriendsAcceptDto: DeleteUserFriendDto = {
          userId: testData.users[0].id,
          friendId: testData.users[1].id,
        };

        await service.deleteUserFriendsByNickname(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest).toBeNull();
      });

      it('[Valid Case]친구가 아닌 사용자 삭제(백에서 씹기)', async () => {
        const userFriendsAcceptDto: DeleteUserFriendDto = {
          userId: testData.users[0].id,
          friendId: testData.users[3].id,
        };

        await service.deleteUserFriendsByNickname(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[3].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(friendRequest).toBeNull();
      });
    });
  });
});
