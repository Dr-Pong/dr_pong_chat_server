import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from 'src/domain/block/block.entity';
import { UserFactory } from 'src/domain/factory/user.factory';
import { User } from 'src/domain/user/user.entity';

@Injectable()
export class BlockTestData {
  constructor(
    private readonly userFactory: UserFactory,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}

  async blockUser(user: User, toBlock: User): Promise<void> {
    await this.blockRepository.save({
      user: { id: user.id },
      blockedUser: { id: toBlock.id },
      isUnblocked: false,
    });
    this.userFactory.block(user.id, toBlock.id);
  }
}
