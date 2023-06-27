import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { Friend } from '../../domain/friend/friend.entity';
import {
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_PENDING,
} from 'src/global/type/type.friend.status';
import { DirectMessageRoom } from 'src/domain/direct-message-room/direct-message-room.entity';
import { FriendChatManager } from 'src/global/utils/generate.room.id';

@Injectable()
export class FriendTestData {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(DirectMessageRoom)
    private directMessageRoomRepository: Repository<DirectMessageRoom>,
  ) {}

  async createFriendRequestFromTo(from: User, to: User): Promise<void> {
    await this.friendRepository.save({
      sender: from,
      receiver: to,
      status: FRIENDSTATUS_PENDING,
    });
  }

  async makeFriend(a: User, b: User): Promise<void> {
    await this.friendRepository.save({
      sender: a,
      receiver: b,
      status: FRIENDSTATUS_FRIEND,
    });
    await this.directMessageRoomRepository.save({
      user: a,
      friend: b,
      roomId: FriendChatManager.generateRoomId(a.id, b.id),
    });
    await this.directMessageRoomRepository.save({
      user: b,
      friend: a,
      roomId: FriendChatManager.generateRoomId(a.id, b.id),
    });
  }
}
