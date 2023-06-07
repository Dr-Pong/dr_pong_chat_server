import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Block } from './block.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BlockRepository {
  constructor(
    @InjectRepository(Block)
    private readonly repository: Repository<Block>,
  ) {}

  async findBlocksByUserId(userId: number): Promise<Block[]> {
    const blocks: Block[] = await this.repository.find({
      where: { id: userId },
    });
    return blocks;
  }
}
