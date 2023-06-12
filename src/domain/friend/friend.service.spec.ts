import { DataSource, Repository } from 'typeorm';
import { FriendService } from './friend.service';
import { FriendTestService } from './test/friend.test.service';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { FriendTestModule } from './test/friend.test.module';
import { Test, TestingModule } from '@nestjs/testing';
import { UserFriendsDto } from './dto/user.friends.dto';
import { Friend } from './friend.entity';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_PENDING,
} from 'src/global/type/type.friend.status';
import { GetUserPendingFriendDto } from './dto/get.user.peding.friend.dto';
import { UserPendingFriendsDto } from './dto/user.pending.friends.dto';
import { PostUserFriendAcceptDto } from './dto/post.user.friend.accept.dto';
import { DeleteUserFriendRejectDto } from './dto/delete.user.friend.reject.dto';
import { PostUserFriendRequestDto } from './dto/post.user.friend.request.dto';
import { DeleteUserFriendDto } from './dto/delete.user.friend.dto';
import { FriendModule } from './friend.module';
import { GetUserFriendNotificationsRequestDto } from './dto/get.user.friend.notifications.request.dto';
import { UserFriendNotificationsDto } from './dto/user.friend.notifications.dto';
import { BadRequestException } from '@nestjs/common';

describe('FriendService', () => {
  let service: FriendService;
  let friendTestService: FriendTestService;
  let dataSources: DataSource;
  let friendRepository: Repository<Friend>;

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
        FriendModule,
        FriendTestModule,
      ],
      providers: [
        {
          provide: getRepositoryToken(Friend),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);
    friendTestService = module.get<FriendTestService>(FriendTestService);
    dataSources = module.get<DataSource>(DataSource);
    friendRepository = module.get<Repository<Friend>>(
      getRepositoryToken(Friend),
    );
  });

  beforeEach(async () => {
    await friendTestService.createProfileImages();
    await friendTestService.createBasicUsers(100);
  });

  afterEach(async () => {
    friendTestService.clear();
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
        const user = friendTestService.users[0];
        for (let i = 1; i <= 12; i++) {
          if (i % 2 == 0)
            await friendTestService.makeFriend(
              user,
              friendTestService.users[i],
            );
          else
            await friendTestService.makeFriend(
              friendTestService.users[i],
              user,
            );
        }
        const friendsList: UserFriendsDto = await service.getUserFriends({
          userId: user.id,
        });
        const friendRequest = await friendRepository.find({
          where: {
            sender: { id: user.id },
            status: FRIENDSTATUS_FRIEND,
          },
        });

        expect(friendsList).toHaveProperty('friends');
        expect(friendsList.friends.length).toBe(12);
        for (let i = 0; i < friendsList.friends.length; i++) {
          const friend = friendsList.friends[i];
          expect(friend).toHaveProperty('nickname');
          expect(friend).toHaveProperty('imgUrl');
        }
        expect(friendsList.friends).toEqual(
          friendsList.friends.sort((a, b) =>
            a.nickname.localeCompare(b.nickname),
          ),
        );
        for (const friend of friendRequest) {
          expect(friend).toHaveProperty('sender');
          expect(friend).toHaveProperty('receiver');
          expect(friend).toHaveProperty('status');
          expect(friend.status).toBe(FRIENDSTATUS_FRIEND);
        }
      });

      it('[Valid Case]친구가 없는경우', async () => {
        const user = friendTestService.users[0];
        const FriendsList = await service.getUserFriends({
          userId: user.id,
        });
        expect(FriendsList.friends.length).toBe(0);
      });

      it('[Valid Case]반환된 친구 목록이 알파벳순서로 정렬되는지 확인', async () => {
        const user = friendTestService.users[0];
        for (let i = 10; i > 0; i--) {
          if (i % 2 == 0)
            await friendTestService.makeFriend(
              user,
              friendTestService.users[i],
            );
          else
            await friendTestService.makeFriend(
              friendTestService.users[i],
              user,
            );
        }
        const friendsList = await service.getUserFriends({ userId: user.id });

        expect(friendsList).toHaveProperty('friends');
        expect(friendsList.friends.length).toBe(10);
        for (let i = 0; i < friendsList.friends.length; i++) {
          const friend = friendsList.friends[i];
          expect(friend).toHaveProperty('nickname');
          expect(friend).toHaveProperty('imgUrl');
        }
        expect(friendsList.friends).toEqual(
          friendsList.friends.sort((a, b) =>
            a.nickname.localeCompare(b.nickname),
          ),
        );
      });
    });

    describe('친구요청', () => {
      it('[Valid Case]유효한 닉네임 친구요청', async () => {
        const user = friendTestService.users[0];
        const wannabeFriend = friendTestService.users[1];

        const userFriendsRequestDto: PostUserFriendRequestDto = {
          userId: user.id,
          friendId: wannabeFriend.id,
        };

        await service.postUserFriendRequest(userFriendsRequestDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: user.id },
            receiver: { id: wannabeFriend.id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_PENDING);
      });

      it('[Valid Case]이미 친구인 유저에게 친구요청(백에서 씹기)', async () => {
        const user = friendTestService.users[0];
        const alreadyFriend = friendTestService.users[1];
        await friendTestService.makeFriend(user, alreadyFriend);

        const userFriendsRequestDto: PostUserFriendRequestDto = {
          userId: user.id,
          friendId: alreadyFriend.id,
        };

        await service.postUserFriendRequest(userFriendsRequestDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: user.id },
            receiver: { id: alreadyFriend.id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });

      it('[Error Case] 자기 자신을 친구 요청', async () => {
        const user = friendTestService.users[0];
        const userFriendsRequestDto: PostUserFriendRequestDto = {
          userId: user.id,
          friendId: user.id,
        };

        await expect(
          service.postUserFriendRequest(userFriendsRequestDto),
        ).rejects.toThrowError(
          new BadRequestException('Cannot request yourself'),
        );
      });
    });

    describe('친구요청 목록', () => {
      it('[Valid Case] 친구요청이 없는경우 빈목록', async () => {
        const user = friendTestService.users[0];
        const getUserPendingDto: GetUserPendingFriendDto = {
          userId: user.id,
        };

        const FriendsList = await service.getUserPendingFriendRequests(
          getUserPendingDto,
        );

        expect(FriendsList.friends).toHaveLength(0);
      });

      it('[Valid Case] 친구요청 목록이 정상적으로 반환 되는지 확인', async () => {
        const user = friendTestService.users[0];
        const requestor1 = friendTestService.users[1];
        const requestor2 = friendTestService.users[2];
        await friendTestService.createFriendRequestFromTo(requestor1, user);
        await friendTestService.createFriendRequestFromTo(requestor2, user);

        const getUserPendingDto: GetUserPendingFriendDto = {
          userId: user.id,
        };

        const friendsList: UserPendingFriendsDto =
          await service.getUserPendingFriendRequests(getUserPendingDto);

        for (let i = 0; i < friendsList.friends.length; i++) {
          const friend = friendsList.friends[i];
          expect(friend).toHaveProperty('nickname');
          expect(friend).toHaveProperty('imgUrl');
          expect(friend.nickname).toBe(friendTestService.users[i + 1].nickname);
          expect(friend.imgUrl).toBe(friendTestService.users[i + 1].image.url);
        }
      });

      it('[Valid Case] 친구요청 목록이 알파벳순서로 정렬되는지 확인', async () => {
        const user = friendTestService.users[0];
        for (let i = 1; i <= 6; i++) {
          await friendTestService.createFriendRequestFromTo(
            friendTestService.users[i],
            user,
          );
          await friendTestService.createFriendRequestFromTo(
            friendTestService.users[13 - i],
            user,
          );
        }

        const getUserPendingDto: GetUserPendingFriendDto = {
          userId: user.id,
        };

        const friendsList: UserPendingFriendsDto =
          await service.getUserPendingFriendRequests(getUserPendingDto);

        expect(friendsList).toHaveProperty('friends');
        expect(friendsList.friends.length).toBe(12);
        for (let i = 0; i < friendsList.friends.length; i++) {
          const friend = friendsList.friends[i];
          expect(friend).toHaveProperty('nickname');
          expect(friend).toHaveProperty('imgUrl');
        }
        expect(friendsList.friends).toEqual(
          friendsList.friends.sort((a, b) =>
            a.nickname.localeCompare(b.nickname),
          ),
        );
      });
    });

    describe('친구요청 수락', () => {
      it('[Valid Case]유효한 친구요청 수락', async () => {
        const user = friendTestService.users[0];
        const requestor = friendTestService.users[1];
        await friendTestService.createFriendRequestFromTo(requestor, user);

        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: user.id,
          friendId: requestor.id,
        };

        await service.postUserFriendAccept(userFriendsAcceptDto);

        const friend: Friend = await friendRepository.findOne({
          where: {
            sender: { id: requestor.id },
            receiver: { id: user.id },
          },
        });

        expect(friend.status).toBe(FRIENDSTATUS_FRIEND);
      });

      it('[Valid Case] 양쪽에서 친구 요청 보낸경우', async () => {
        const user = friendTestService.users[0];
        const mutual = friendTestService.users[1];
        await friendTestService.createFriendRequestFromTo(user, mutual);
        await friendTestService.createFriendRequestFromTo(mutual, user);

        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: user.id,
          friendId: mutual.id,
        };

        await service.postUserFriendAccept(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: mutual.id },
            receiver: { id: user.id },
          },
        });
        const anotherFriendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: user.id },
            receiver: { id: mutual.id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
        expect(anotherFriendRequest).toBe(null);
      });

      it('[Valid Case]이미 친구인 유저에게 친구요청 수락(백에서 씹기)', async () => {
        const user = friendTestService.users[0];
        const alreadyFriend = friendTestService.users[1];
        await friendTestService.makeFriend(alreadyFriend, user);
        await friendTestService.createFriendRequestFromTo(alreadyFriend, user);

        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: user.id,
          friendId: alreadyFriend.id,
        };

        await service.postUserFriendAccept(userFriendsAcceptDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: alreadyFriend.id },
            receiver: { id: user.id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });

      it('[Error Case] 자기 자신을 친구 요청 수락', async () => {
        const user = friendTestService.users[0];
        const userFriendsAcceptDto: PostUserFriendAcceptDto = {
          userId: user.id,
          friendId: user.id,
        };

        await expect(
          service.postUserFriendAccept(userFriendsAcceptDto),
        ).rejects.toThrowError(
          new BadRequestException('Cannot request yourself'),
        );
      });
    });

    describe('친구요청 거절', () => {
      it('[Valid Case]친구요청 거절', async () => {
        const user = friendTestService.users[0];
        const rejectUser = friendTestService.users[1];
        await friendTestService.createFriendRequestFromTo(user, rejectUser);

        const userFriendRejectDto: DeleteUserFriendRejectDto = {
          userId: rejectUser.id,
          friendId: user.id,
        };

        await service.deleteUserFriendReject(userFriendRejectDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: user.id },
            receiver: { id: rejectUser.id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_DELETED);
      });

      it('[Valid Case] 이미 친구인 사용자에게 친구요청 거절(백에서 씹기)', async () => {
        const user = friendTestService.users[0];
        const alreadyFriend = friendTestService.users[1];
        await friendTestService.makeFriend(user, alreadyFriend);

        const userFriendRejectDto: DeleteUserFriendRejectDto = {
          userId: alreadyFriend.id,
          friendId: user.id,
        };

        await service.deleteUserFriendReject(userFriendRejectDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: user.id },
            receiver: { id: alreadyFriend.id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);
      });

      it('[Error Case] 자기 자신을 친구 요청 거절', async () => {
        const user = friendTestService.users[0];
        const userFriendRejectDto: DeleteUserFriendRejectDto = {
          userId: user.id,
          friendId: user.id,
        };

        await expect(
          service.deleteUserFriendReject(userFriendRejectDto),
        ).rejects.toThrowError(
          new BadRequestException('Cannot request yourself'),
        );
      });
    });

    describe('친구 삭제', () => {
      it('[Valid Case]친구삭제', async () => {
        const user = friendTestService.users[0];
        const friendToDelete = friendTestService.users[1];
        await friendTestService.makeFriend(user, friendToDelete);

        const deleteFriendDto: DeleteUserFriendDto = {
          userId: user.id,
          friendId: friendToDelete.id,
        };

        await service.deleteUserFriend(deleteFriendDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: user.id },
            receiver: { id: friendToDelete.id },
          },
        });

        expect(friendRequest.status).toBe(FRIENDSTATUS_DELETED);
      });

      it('[Valid Case]친구가 아닌 사용자 삭제(백에서 씹기)', async () => {
        const user = friendTestService.users[0];
        const notFriend = friendTestService.users[1];

        const deleteFriendDto: DeleteUserFriendDto = {
          userId: user.id,
          friendId: notFriend.id,
        };

        await service.deleteUserFriend(deleteFriendDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            sender: { id: user.id },
            receiver: { id: notFriend.id },
          },
        });

        expect(friendRequest).toBeNull();
      });

      it('[Error Case] 자기 자신을 친구 삭제', async () => {
        const user = friendTestService.users[0];
        const deleteFriendDto: DeleteUserFriendDto = {
          userId: user.id,
          friendId: user.id,
        };

        await expect(
          service.deleteUserFriend(deleteFriendDto),
        ).rejects.toThrowError(
          new BadRequestException('Cannot request yourself'),
        );
      });
    });

    describe('친구 요청 개수', () => {
      it('[Valid Case]친구요청이 없는경우', async () => {
        const user = friendTestService.users[0];
        const userFriendNotificationDto: GetUserFriendNotificationsRequestDto =
          {
            userId: user.id,
          };

        const friendRequestCount: UserFriendNotificationsDto =
          await service.getUserFriendNotificationCount(
            userFriendNotificationDto,
          );

        expect(friendRequestCount.requestCount).toBe(0);
      });

      it('[Valid Case]친구요청이 있는경우', async () => {
        const user = friendTestService.users[0];
        for (let i = 1; i < 10; i++) {
          await friendTestService.createFriendRequestFromTo(
            friendTestService.users[i],
            user,
          );
        }

        const userFriendNotificationDto: GetUserFriendNotificationsRequestDto =
          {
            userId: user.id,
          };

        const friendRequestCount: UserFriendNotificationsDto =
          await service.getUserFriendNotificationCount(
            userFriendNotificationDto,
          );

        expect(friendRequestCount.requestCount).toBe(9);
      });

      it('[Valid Case]  50개 까지만 요청 받기', async () => {
        const user = friendTestService.users[0];
        for (let i = 1; i < 100; i++) {
          await friendTestService.createFriendRequestFromTo(
            friendTestService.users[i],
            user,
          );
        }

        const userFriendNotificationDto: GetUserFriendNotificationsRequestDto =
          {
            userId: user.id,
          };

        const friendRequestCount: UserFriendNotificationsDto =
          await service.getUserFriendNotificationCount(
            userFriendNotificationDto,
          );

        expect(friendRequestCount.requestCount).toBe(50);
      });
    });
  });
});
