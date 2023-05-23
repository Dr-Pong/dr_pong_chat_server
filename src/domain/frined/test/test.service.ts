import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { Friend } from '../friend.entity';
import { Block } from 'src/domain/block/block.entity';
import {
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';
import { FriendChatManager } from 'src/global/utils/generate.room.id';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}
  users: User[] = [];
  profileImages: ProfileImage[] = [];
  friends: Friend[] = [];
  blocks: Block[] = [];

  clear() {
    this.users.splice(0);
    this.profileImages.splice(0);
    this.friends.splice(0);
    this.blocks.splice(0);
  }

  async createProfileImages(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      const profileImage = await this.profileImageRepository.save({
        url: 'profileImage' + i.toString(),
      });
      this.profileImages.push(profileImage);
    }
  }

  async createBasicUsers(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      const user = await this.userRepository.save({
        id: i,
        nickname: 'user' + i.toString(),
        image: this.profileImages[i],
      });
      this.users.push(user);
    }
  }

  async createBasicUser() {
    const index: number = this.users.length;
    const user = await this.userRepository.save({
      id: index,
      nickname: 'user' + index.toString(),
      image: this.profileImages[0],
    });
    this.users.push(user);
  }

  async createUserRequesting(): Promise<Friend[]> {
    const index: number = this.friends.length;
    for (let i = 1; i < 10; i++) {
      const friend = await this.friendRepository.save({
        id: index + i,
        user: this.users[0],
        friend: this.users[i],
        status: FRIENDSTATUS_REQUESTING,
      });
      this.friends.push(friend);
      return this.friends;
    }
  }

  async createAnotherUsersRequesting(): Promise<Friend[]> {
    const index: number = this.friends.length;
    for (let i = 1; i < 10; i++) {
      const friend = await this.friendRepository.save({
        id: index + i,
        user: this.users[i],
        friend: this.users[0],
        status: FRIENDSTATUS_REQUESTING,
      });
      this.friends.push(friend);
      return this.friends;
    }
  }

  async createUserFriends(): Promise<Friend[]> {
    for (let i = 1; i < 10; i++) {
      const roomId = FriendChatManager.generateRoomId(
        this.users[0].id.toString(),
        this.users[i].id.toString(),
      );
      const friend1 = await this.friendRepository.save({
        roomId: roomId,
        user: this.users[0],
        friend: this.users[i],
        status: FRIENDSTATUS_FRIEND,
        chatOn: false,
      });
      this.friends.push(friend1);
      const friend2 = await this.friendRepository.save({
        roomId: roomId,
        user: this.users[i],
        friend: this.users[0],
        status: FRIENDSTATUS_FRIEND,
        chatOn: false,
      });
      this.friends.push(friend2);
    }
    return this.friends;
  }

  async createUserBlocks(): Promise<Block[]> {
    const index: number = this.blocks.length;
    for (let i = 1; i < 10; i++) {
      const block = await this.blockRepository.save({
        id: index + i,
        user: this.users[0],
        block: this.users[i],
      });
      this.blocks.push(block);
      return this.blocks;
    }
  }
}
