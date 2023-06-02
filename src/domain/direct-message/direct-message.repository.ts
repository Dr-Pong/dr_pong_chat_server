import { Injectable } from '@nestjs/common';
import { DirectMessage } from './direct-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendChatManager } from 'src/global/utils/generate.room.id';

@Injectable()
export class DirectMessageRepository {
  constructor(
    @InjectRepository(DirectMessage)
    private readonly repository: Repository<DirectMessage>,
  ) {}

  async findAllDirectMessageByUserIdAndFriendId(
    userId: number,
    friendId: number,
    offset: number,
    count: number,
  ): Promise<DirectMessage[]> {
    const directMessages: DirectMessage[] = await this.repository.find({
      where: {
        roomId: FriendChatManager.generateRoomId(
          userId.toString(),
          friendId.toString(),
        ),
      },
      skip: offset,
      take: count,
    });
    return directMessages;
  }

  async saveDirectMessageByUserIdAndFriendId(
    userId: number,
    friendId: number,
    message: string,
  ): Promise<void> {
    const directMessage: DirectMessage = await this.repository.create({
      sender: { id: userId },
      roomId: FriendChatManager.generateRoomId(
        userId.toString(),
        friendId.toString(),
      ),
      message: message,
      time: new Date(),
    });
    await this.repository.save(directMessage);
  }
}
