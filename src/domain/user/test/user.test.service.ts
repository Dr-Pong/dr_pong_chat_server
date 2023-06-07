import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserTestService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
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
}
