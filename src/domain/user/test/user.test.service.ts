import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Block } from 'src/domain/block/block.entity';
import { Friend } from 'src/domain/friend/friend.entity';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { FRIENDSTATUS_FRIEND } from 'src/global/type/type.friend.status';
import { Repository } from 'typeorm';

@Injectable()
export class UserTestService {
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

  clear() {
    this.users.splice(0);
    this.profileImages.splice(0);
  }

  async createProfileImages(): Promise<void> {
    for (let i = 0; i < 2; i++) {
      const profileImage = await this.profileImageRepository.save({
        url: 'profileImage' + i.toString(),
      });
      this.profileImages.push(profileImage);
    }
  }

  async createBasicUser(nickname: string): Promise<User> {
    const user = await this.userRepository.save({
      nickname: nickname,
      image: this.profileImages[0],
    });
    this.users.push(user);
    return user;
  }

  async createBasicUsers(person: number): Promise<void> {
    const index: number = person;
    for (let i = 0; i < index; i++) {
      const user = await this.userRepository.save({
        nickname: 'user' + i.toString(),
        image: this.profileImages[i % 2 == 0 ? 0 : 1],
      });
      this.users.push(user);
    }
  }

  async makeFriend(user: User, friend: User): Promise<void> {
    await this.friendRepository.save({
      sender: user,
      receiver: friend,
      status: FRIENDSTATUS_FRIEND,
    });
  }

  async makeBlock(user: User, blocked: User): Promise<void> {
    await this.blockRepository.save({
      user: user,
      blockedUser: blocked,
    });
  }
}
