import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { PostGatewayUserDto } from './dto/post.gateway.users.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}
  async findByNickname(nickname: string): Promise<User> {
    return await this.repository.findOne({
      where: { nickname: nickname },
    });
  }

  async findAll(): Promise<User[]> {
    return await this.repository.find();
  }

  async save(postDto: PostGatewayUserDto): Promise<User> {
    return await this.repository.save({
      id: postDto.id,
      nickname: postDto.nickname,
      image: {
        id: postDto.imgId,
        url: postDto.imgUrl,
      },
    });
  }
}
