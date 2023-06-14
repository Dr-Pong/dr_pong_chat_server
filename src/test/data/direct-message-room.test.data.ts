import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { DirectMessageRoom } from 'src/domain/direct-message-room/direct-message-room.entity';
import { DirectMessage } from '../../domain/direct-message/direct-message.entity';

@Injectable()
export class DirectMessageRoomTestData {
  constructor(
    @InjectRepository(DirectMessage)
    private directMessageRepository: Repository<DirectMessage>,
    @InjectRepository(DirectMessageRoom)
    private directMessageRoomRepository: Repository<DirectMessageRoom>,
  ) {}

  async createEmptyDirectMessageRoom(user1: User, user2: User): Promise<void> {
    await this.directMessageRoomRepository.save({
      user: user1,
      friend: user2,
      roomId: FriendChatManager.generateRoomId(
        user1.id.toString(),
        user2.id.toString(),
      ),
      lastReadMessageId: null,
      isDisplay: true,
    });
  }

  async createAllReadDirectMessageRoom(
    user1: User,
    user2: User,
  ): Promise<void> {
    const roomId = FriendChatManager.generateRoomId(
      user1.id.toString(),
      user2.id.toString(),
    );
    const roomMessages = await this.directMessageRepository.find({
      where: { roomId: roomId },
    });
    await this.directMessageRoomRepository.save({
      user: user1,
      friend: user2,
      roomId: roomId,
      lastReadMessageId: roomMessages[roomMessages.length - 1].id,
      isDisplay: true,
    });
  }

  async createHalfReadDirectMessageRoom(
    user1: User,
    user2: User,
  ): Promise<void> {
    const roomId = FriendChatManager.generateRoomId(
      user1.id.toString(),
      user2.id.toString(),
    );
    const roomMessages = await this.directMessageRepository.find({
      where: { roomId: roomId },
    });
    const halfIndex = Math.floor(roomMessages.length / 2);
    await this.directMessageRoomRepository.save({
      user: user1,
      friend: user2,
      roomId: roomId,
      lastReadMessageId: roomMessages[halfIndex].id,
      isDisplay: true,
    });
  }
}
