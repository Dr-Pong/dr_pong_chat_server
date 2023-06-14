import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from 'src/domain/block/block.entity';
import { UserFactory } from 'src/domain/factory/user.factory';

@Injectable()
export class BlockTestData {
  constructor(
    private readonly userFactory: UserFactory,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}

  async blockUser(userId: number, toBlockId: number): Promise<void> {
    await this.blockRepository.save({
      user: { id: userId },
      blockedUser: { id: toBlockId },
      isUnblocked: false,
    });
    this.userFactory.block(userId, toBlockId);
  }
}
