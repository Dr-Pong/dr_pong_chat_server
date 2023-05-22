import { DataSource, Not, Repository } from 'typeorm';
import { FriendService } from './friend.service';
import { TestService } from './test/test.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from 'src/configs/typeorm.config';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { FrinedModule } from './frined.module';
import { TestModule } from './test/test.module';
import { Test, TestingModule } from '@nestjs/testing';
import { GetUserFriendsDto } from './dto/get.user.friends.dto';
import { UserFriendsDto } from './dto/user.friends.dto';
import { PostUserFriendsRequesttDto as PostUserFriendsRequestDto } from './dto/post.user.friends.request.dto';
import { Friend } from './friend.entity';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';
import { BadRequestException } from '@nestjs/common';
import { GetUserPendingFriendsDto } from './dto/get.user.peding.friends.dto';
import { UserPendingFriendsDto } from './dto/user.pending.friends.dto';
import { PostUserFriendsAcceptDto } from './dto/post.user.friends.accept.dto';
import {
  DeleteUserFriendsRejectDto,
  PostUserFriendsRejectDto,
} from './dto/delete.user.friends.reject.dto';

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
    await testData.createBasicUsers();
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
        await testData.createUser0Friends();
        const userFriendsDto: GetUserFriendsDto = {
          userId: testData.users[0].id,
        };

        const FriendsList: UserFriendsDto =
          service.getUserFriendsByNickname(userFriendsDto);

        const friendRequest: Friend = await friendRepository.findOne({
          where: {
            user: { id: testData.users[0].id },
            friend: { id: testData.users[1].id },
            status: Not(FRIENDSTATUS_DELETED),
          },
        });

        expect(FriendsList).toHaveProperty('users');
        expect(FriendsList.users).toHaveProperty('nickname');
        expect(FriendsList.users).toHaveProperty('imgUrl');

        expect(friendRequest.status).toBe(FRIENDSTATUS_FRIEND);

        expect(FriendsList.users.length).toBe(9);
        expect(FriendsList.users[0]).toBe(testData.users[1]);
        expect(FriendsList.users[1]).toBe(testData.users[2]);
        expect(FriendsList.users[8]).toBe(testData.users[9]);
      });
    });
    describe('친구요청', () => {
      it('[Valid Case]친구요청', async () => {
        const userFriendsRequestDto: PostUserFriendsRequestDto = {
          userId: testData.users[0].id,
          friendsId: testData.users[1].id,
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

      // it('[Error Case]없는 유저에게 친구요청', async () => {
      //   const userFriendsRequestDto: PostUserFriendsRequestDto = {
      //     userId: testData.users[0].id,
      //     friendsId: 100,
      //   };

      //   await service.postUserFriendsRequestByNickname(userFriendsRequestDto);

      //   const friendRequest: Friend = await friendRepository.findOne({
      //     where: {
      //       user: { id: testData.users[0].id },
      //       friend: { id: 100 },
      //       status: Not(FRIENDSTATUS_DELETED),
      //     },
      //   });

      //   expect(friendRequest).rejects.toThrow(new BadRequestException());
      // });

      // it('[Error Case]이미 친구인 유저에게 친구요청', async () => {
      //   await testData.createUser0Friends();
      //   const userFriendsRequestDto: PostUserFriendsRequestDto = {
      //     userId: testData.users[0].id,
      //     friendsId: testData.users[1].id,
      //   };

      //   await service.postUserFriendsRequestByNickname(userFriendsRequestDto);

      //   const friendRequest: Friend = await friendRepository.findOne({
      //     where: {
      //       user: { id: testData.users[0].id },
      //       friend: { id: testData.users[1].id },
      //       status: Not(FRIENDSTATUS_DELETED),
      //     },
      //   });

      //   expect(friendRequest).rejects.toThrow(new BadRequestException());
      // });

      // it('[Error Case]차단한 유저에게 친구요청', async () => {
      //   await testData.createUser0Blocks();
      //   const userFriendsRequestDto: PostUserFriendsRequestDto = {
      //     userId: testData.users[0].id,
      //     friendsId: testData.users[1].id,
      //   };

      //   await service.postUserFriendsRequestByNickname(userFriendsRequestDto);

      //   const friendRequest: Friend = await friendRepository.findOne({
      //     where: {
      //       user: { id: testData.users[0].id },
      //       friend: { id: testData.users[1].id },
      //       status: Not(FRIENDSTATUS_DELETED),
      //     },
      //   });

      //   expect(friendRequest).rejects.toThrow(new BadRequestException());
      // });

      // it('[Error Case]차단한 유저가 친구요청', async () => {
      //   await testData.createUser0Blocks();
      //   const blockFriendsRequestDto: PostUserFriendsRequestDto = {
      //     userId: testData.users[1].id,
      //     friendsId: testData.users[0].id,
      //   };

      //   await service.postUserFriendsRequestByNickname(blockFriendsRequestDto);

      //   const friendRequest: Friend = await friendRepository.findOne({
      //     where: {
      //       user: { id: testData.users[1].id },
      //       friend: { id: testData.users[0].id },
      //       status: Not(FRIENDSTATUS_DELETED),
      //     },
      //   });

      //   expect(friendRequest).toBeNull();
      // });
    });
    describe('친구요청 목록', () => {
      it('[Valid Case] 친구요청 목록', async () => {
        await testData.createUser0Requesting();

        const userFriendsRequestDto: GetUserPendingFriendsDto = {
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
        expect(FriendsList.users).toHaveProperty('nickname');
        expect(FriendsList.users).toHaveProperty('imgUrl');

        expect(friendRequest.status).toBe(FRIENDSTATUS_REQUESTING);

        expect(FriendsList.users[0]).toBe(testData.users[4]);
        expect(FriendsList.users[1]).toBe(testData.users[5]);
        expect(FriendsList.users[2]).toBe(testData.users[6]);
      });
    });
    describe('친구요청 수락', () => {
      it('[Valid Case]친구요청 수락', async () => {
        await testData.createUser0Requesting();

        const userFriendsAcceptDto: PostUserFriendsAcceptDto = {
          userId: testData.users[0].id,
          friendsId: testData.users[1].id,
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
        await testData.createUser0Requesting();

        const userFriendsAcceptDto: DeleteUserFriendsRejectDto = {
          userId: testData.users[0].id,
          friendsId: testData.users[1].id,
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
        await testData.createUser0Friends();

        const userFriendsAcceptDto: DeleteUserFriendDto = {
          userId: testData.users[0].id,
          friendsId: testData.users[1].id,
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
    });
  });
});