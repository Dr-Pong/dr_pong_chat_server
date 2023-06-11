import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { Block } from 'src/domain/block/block.entity';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { Friend } from 'src/domain/friend/friend.entity';
import { DirectMessage } from '../direct-message.entity';
import { DirectMessageRoom } from 'src/domain/direct-message-room/direct-message-room.entity';

@Injectable()
export class DirectMessageTestService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
    @InjectRepository(DirectMessage)
    private directMessageRepository: Repository<DirectMessage>,
    @InjectRepository(DirectMessageRoom)
    private friendDirectMessageRepository: Repository<DirectMessageRoom>,
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

  async createDirectMessageRoom(user1: User, user2: User): Promise<void> {
    await this.friendDirectMessageRepository.save({
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
}
