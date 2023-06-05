import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectMessageRoom } from './direct-message-room.entity';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { DirectMessage } from '../direct-message/direct-message.entity';

@Injectable()
export class DirectMessageRoomRepository {
  constructor(
    @InjectRepository(DirectMessageRoom)
    private readonly repository: Repository<DirectMessageRoom>,
  ) {}

  async findByUserIdAndFriendId(
    userId: number,
    friendId: number,
  ): Promise<DirectMessageRoom> {
    const directMessageRoom: DirectMessageRoom = await this.repository.findOne({
      where: {
        userId: { id: userId },
        friendId: { id: friendId },
      },
    });
    return directMessageRoom;
  }

  async findAllByUserId(userId: number): Promise<DirectMessageRoom[]> {
    const directMessageRooms: DirectMessageRoom[] = await this.repository.find({
      where: { userId: { id: userId } },
    });
    return directMessageRooms;
  }

  async save(userId: number, friendId: number): Promise<DirectMessageRoom> {
    const directMessageRoom: DirectMessageRoom = await this.repository.create({
      userId: { id: userId },
      friendId: { id: friendId },
      roomId: FriendChatManager.generateRoomId(
        userId.toString(),
        friendId.toString(),
      ),
      lastReadMessageId: null,
      isDisplay: true,
    });
    return await this.repository.save(directMessageRoom);
  }

  async delete(directMessageRoom: DirectMessageRoom): Promise<void> {
    await this.repository.remove(directMessageRoom);
  }

  async updateIsDisplayByUserIdAndFriendId(userId: number, friendId: number) {
    await this.repository.update(
      {
        userId: { id: userId },
        friendId: { id: friendId },
      },
      { isDisplay: false },
    );
  }

  async updateLastMessageIdByUserIdAndFriendId(
    userId: number,
    friendId: number,
    lastmessage: DirectMessage,
  ) {
    await this.repository.update(
      {
        userId: { id: userId },
        friendId: { id: friendId },
      },
      { lastReadMessageId: lastmessage.id },
    );
  }
}
