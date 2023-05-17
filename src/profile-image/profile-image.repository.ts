import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileImage } from './profile-image.entity';

@Injectable()
export class ProfileImageRepository {
  constructor(
    @InjectRepository(ProfileImage)
    private readonly repository: Repository<ProfileImage>,
  ) {}

  async findById(id: number): Promise<ProfileImage> {
    return await this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<ProfileImage[]> {
    return await this.repository.find();
  }
}
