import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { DirectMessage } from '../../domain/direct-message/direct-message.entity';

@Injectable()
export class DirectMessageTestData {
  constructor(
    @InjectRepository(DirectMessage)
    private directMessageRepository: Repository<DirectMessage>,
  ) {}
  private count = 0;

  async createDirectMessageFromTo(from: User, to: User): Promise<void> {
    await this.directMessageRepository.save({
      sender: from,
      roomId: FriendChatManager.generateRoomId(from.id, to.id),
      message: 'message' + (++this.count).toString(),
      time: new Date().toISOString(),
    });
  }
}
