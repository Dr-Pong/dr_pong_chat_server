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
   * unblocked가 false == 차단 on이라는뜻
   */
  async findBlocksByUserId(userId: number): Promise<Block[]> {
    const blocks: Block[] = await this.repository.find({
      where: { user: { id: userId }, isUnblocked: false },
    });
    return blocks;
  }

  /** 차단 조회
   * 특정 사용자를 차단유무를 확인하는 함수입니다.
   */
  async findBlockByUserIdAndTargetId(
    userId: number,
    targetId: number,
  ): Promise<Block> {
    const block: Block = await this.repository.findOne({
      where: {
        user: { id: userId },
        blockedUser: { id: targetId },
        isUnblocked: false,
      },
    });
    return block;
  }

  /** 차단 조회
   * 특정 사용자를 차단유무를 확인하는 함수입니다.
   */
  async checkIsBlockByUserIdAndTargetId(
    userId: number,
    targetId: number,
  ): Promise<boolean> {
    return await this.repository.exist({
      where: {
        user: { id: userId },
        blockedUser: { id: targetId },
        isUnblocked: false,
      },
    });
  }

  /** 차단 생성
   * 특정 사용자를 차단하는 함수입니다.
   */
  async createUserBlock(userId: number, targetId: number): Promise<void> {
    await this.repository.save({
      user: { id: userId },
      blockedUser: { id: targetId },
      isUnblocked: false,
    });
  }

  /** 차단 삭제
   * 특정 사용자를 차단 해제하는 함수입니다.
   */
  async deleteUserBlock(userId: number, targetId: number): Promise<void> {
    await this.repository.update(
      {
        user: { id: userId },
        blockedUser: { id: targetId },
      },
      { isUnblocked: true },
    );
  }
}
