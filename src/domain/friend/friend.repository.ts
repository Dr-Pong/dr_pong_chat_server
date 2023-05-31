import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';

@Injectable()
export class FriendRepository {
  constructor(
    @InjectRepository(Friend)
    private readonly repository: Repository<Friend>,
  ) {}

  async findFriendsById(userId: number): Promise<Friend[]> {
    const friends: Friend[] = await this.repository.find({
      where: [{ user: { id: userId } }, { friend: { id: userId } }],
    });
    return friends;
  }

  async findFriendTables(userId: number, friendId: number): Promise<Friend[]> {
    const deletedFriends: Friend[] = await this.repository.find({
      where: [{ user: { id: userId }, friend: { id: friendId } }],
    });
    return deletedFriends;
  }

  async saveFriendRequest(userId: number, friendId: number): Promise<void> {
    await this.repository.save({
      user: { id: userId },
      friend: { id: friendId },
      status: FRIENDSTATUS_REQUESTING,
    });
  }

  async findPendingFriendsById(userId: number): Promise<Friend[]> {
    const pendingFriends: Friend[] = await this.repository.find({
      where: [{ user: { id: userId } }, { friend: { id: userId } }],
    });
    return pendingFriends;
  }
}
