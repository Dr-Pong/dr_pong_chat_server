import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FriendRepository {
  constructor(
    @InjectRepository(Friend)
    private readonly repository: Repository<Friend>,
  ) {}

  async findFriendsById(userId: number): Promise<Friend[]> {
    const friends: Friend[] = await this.repository.find({
      where: [{ user: { id: userId } }, { friend: { id: userId } }],
      order: { friend: { nickname: 'ASC' } },
    });
    return friends;
  }
}
