import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

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
}
