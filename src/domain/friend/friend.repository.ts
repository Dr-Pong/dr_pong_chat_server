import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FRIENDSTATUS_DELETED,
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';

@Injectable()
export class FriendRepository {
  constructor(
    @InjectRepository(Friend)
    private readonly repository: Repository<Friend>,
  ) {}

  async findFriendsByUserId(userId: number): Promise<Friend[]> {
    const friends: Friend[] = await this.repository.find({
      where: [{ sender: { id: userId } }, { reciever: { id: userId } }],
    });
    return friends;
  }

  async findAllFriendsByUserIdAndFrinedId(
    userId: number,
    friendId: number,
  ): Promise<Friend[]> {
    const deletedFriends: Friend[] = await this.repository.find({
      where: [{ sender: { id: userId }, reciever: { id: friendId } }],
    });
    return deletedFriends;
  }

  async saveFriendStatusRequestingByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<void> {
    await this.repository.save({
      sender: { id: userId },
      reciever: { id: friendId },
      status: FRIENDSTATUS_REQUESTING,
    });
  }

  async findAllFriendsStatusPendingByUserId(userId: number): Promise<Friend[]> {
    const pendingFriends: Friend[] = await this.repository.find({
      where: [{ sender: { id: userId } }, { reciever: { id: userId } }],
    });
    return pendingFriends;
  }

  async updateFriendRequestStatusFriendByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<void> {
    await this.repository.update(
      {
        sender: { id: In([userId, friendId]) },
        reciever: { id: In([userId, friendId]) },
      },
      { status: FRIENDSTATUS_FRIEND },
    );
  }

  async updateFriendRequestStatusDeletedByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<void> {
    await this.repository.update(
      {
        sender: { id: In([userId, friendId]) },
        reciever: { id: In([userId, friendId]) },
      },
      { status: FRIENDSTATUS_DELETED },
    );
  }
}
