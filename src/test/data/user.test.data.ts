import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from 'src/domain/factory/model/user.model';
import { UserFactory } from 'src/domain/factory/user.factory';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserTestData {
  constructor(
    private readonly userFactory: UserFactory,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private imageRepository: Repository<ProfileImage>,
  ) {}
  users: User[] = [];
  profileImages: ProfileImage[] = [];

  clear() {
    this.users.splice(0);
    this.profileImages.splice(0);
  }

  async createProfileImage(): Promise<void> {
    this.profileImages.push(
      await this.imageRepository.save({
        url: 'https://avatars.githubusercontent.com/u/48426991?v=4',
      }),
    );
  }

  async createUser(nickname: string): Promise<User> {
    if (this.profileImages.length == 0) {
      await this.createProfileImage();
    }
    const user: User = await this.userRepository.save({
      id: this.users.length + 1,
      nickname: nickname,
      image: this.profileImages[0],
    });
    this.users.push(user);
    const userModel: UserModel = UserModel.fromEntity(user);
    this.userFactory.create(userModel);
    return user;
  }

  async createBasicUser(nickname: string): Promise<User> {
    return await this.createUser(nickname);
  }

  async createBasicUsers(person: number): Promise<void> {
    const index: number = person;
    for (let i = 0; i < index; i++) {
      await this.createUser(`user${i}`);
    }
  }

  async giveTokenToUser(user: UserModel | User): Promise<string> {
    const token = this.jwtService.sign({
      id: user.id,
      nickname: user.nickname,
    });
    return token;
  }
}
