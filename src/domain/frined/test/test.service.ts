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

  async createUser0Requesting(): Promise<Friend[]> {
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

  async createUser0Friends(): Promise<Friend[]> {
    const index: number = this.friends.length;
    for (let i = 1; i < 10; i++) {
      const friend = await this.friendRepository.save({
        id: index + i,
        user: this.users[0],
        friend: this.users[i],
        status: FRIENDSTATUS_FRIEND,
      });
      this.friends.push(friend);
      return this.friends;
    }
  }

  async createUser0Blocks(): Promise<Block[]> {
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