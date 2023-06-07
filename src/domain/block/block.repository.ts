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

  /** 차단목록 조회
   * 특정 사용자의 차단 목록을 조회하는 함수입니다.
   */
  async findBlocksByUserId(userId: number): Promise<Block[]> {
    const blocks: Block[] = await this.repository.find({
      where: { id: userId },
    });
    return blocks;
  }
}
