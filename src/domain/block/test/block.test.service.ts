import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { Block } from 'src/domain/block/block.entity';

@Injectable()
export class BlockTestService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}
  users: User[] = [];
  profileImages: ProfileImage[] = [];
  blocks: Block[] = [];

  clear() {
    this.users.splice(0);
    this.profileImages.splice(0);
    this.blocks.splice(0);
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

  async createUserBlocks(person: number): Promise<void> {
    for (let i = 1; i < person; i++) {
      const block = await this.blockRepository.save({
        user: this.users[0],
        blockedUser: this.users[i],
      });
      this.blocks.push(block);
    }
  }
}
