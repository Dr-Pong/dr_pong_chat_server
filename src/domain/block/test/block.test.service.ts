import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { Block } from 'src/domain/block/block.entity';
import { UserFactory } from 'src/domain/factory/user.factory';
import { UserModel } from 'src/domain/factory/model/user.model';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BlockTestService {
  constructor(
    private jwtService: JwtService,
    private readonly userFactory: UserFactory,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
    @InjectRepository(ProfileImage)
    private readonly imageRepository: Repository<ProfileImage>,
  ) {}

  async createUser(nickname: string): Promise<UserModel> {
    const user: User = await this.userRepository.save({
      nickname: nickname,
      image: await this.imageRepository.save({
        url: 'https://avatars.githubusercontent.com/u/48426991?v=4',
      }),
    });
    const userModel: UserModel = UserModel.fromEntity(user);
    this.userFactory.create(userModel);
    return this.userFactory.findById(user.id);
  }

  async createBasicUser(nickname: string): Promise<UserModel> {
    return await this.createUser(nickname);
  }

  async createUserBlocks(user1: UserModel, user2: UserModel): Promise<void> {
    await this.blockRepository.save({
      user: { id: user1.id },
      blockedUser: { id: user2.id },
      isUnblocked: false,
    });
    this.userFactory.block(user1.id, user2.id);
  }

  async giveTokenToUser(user: UserModel) {
    const token = this.jwtService.sign({
      id: user.id,
      nickname: user.nickname,
    });
    return token;
  }
}
