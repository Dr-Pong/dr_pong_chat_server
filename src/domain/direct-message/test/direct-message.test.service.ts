import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { DirectMessage } from '../direct-message.entity';

@Injectable()
export class DirectMessageTestService {
  constructor(
    @InjectRepository(DirectMessage)
    private directMessageRepository: Repository<DirectMessage>,
  ) {}
  directMessage: DirectMessage[] = [];
  private count: number = 0;

  clear() {
    this.directMessage = [];
  }

  async createDirectMessageFromTo(from: User, to: User): Promise<void> {
    await this.directMessageRepository.save({
      sender: from,
      roomId: FriendChatManager.generateRoomId(
        from.id.toString(),
        to.id.toString(),
      ),
      message: 'message' + (++this.count).toString(),
      time: new Date().toISOString(),
    });
  }
}
