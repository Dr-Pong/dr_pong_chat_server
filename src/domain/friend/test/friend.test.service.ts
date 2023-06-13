import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { Friend } from '../friend.entity';
import {
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_PENDING,
} from 'src/global/type/type.friend.status';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class FriendTestService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
  ) {}
  users: User[] = [];
  profileImages: ProfileImage[] = [];

  clear() {
    this.users = [];
    this.profileImages = [];
  }

  async createProfileImages(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      const profileImage = await this.profileImageRepository.save({
        url: 'profileImage' + i.toString(),
      });
      this.profileImages.push(profileImage);
    }
  }

  async createBasicUsers(n: number): Promise<void> {
    for (let i = 0; i < n; i++) {
      const user = await this.userRepository.save({
        nickname: 'user' + i.toString(),
        image:
          this.profileImages[
            Math.floor(Math.random() * this.profileImages.length)
          ],
      });
      this.users.push(user);
    }
  }

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
  }

  async giveTokenToUser(user: User) {
    const token = this.jwtService.sign({
      id: user.id,
      nickname: user.nickname,
    });
    return token;
  }
}
