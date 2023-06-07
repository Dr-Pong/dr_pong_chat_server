import { Injectable } from '@nestjs/common';
import { BlockRepository } from './block.repository';
import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { UserBlocksDto } from './dto/user.blocks.dto';
import { GetUserBlocksDto } from './dto/get.user.blocks.dto';
import { Block } from './block.entity';
import { BlockUserInfoDto } from './dto/user.blocks.dto';

@Injectable()
export class BlockService {
  constructor(private blockRepository: BlockRepository) {}

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserBlocks(getDto: GetUserBlocksDto): Promise<UserBlocksDto> {
    const unsortedBlockedUsers: Block[] =
      await this.blockRepository.findBlocksByUserId(getDto.userId);
    const blockedUsers: BlockUserInfoDto[] = unsortedBlockedUsers.map(
      (block) => {
        return {
          nickname: block.blockedUser.nickname,
          imgUrl: block.blockedUser.image.url,
        };
      },
    );
    blockedUsers.sort((a, b) => {
      if (a.nickname > b.nickname) {
        return 1;
      }
      if (a.nickname < b.nickname) {
        return -1;
      }
      return 0;
    });
    const responseDto: UserBlocksDto = {
      users: blockedUsers,
    };
    return responseDto;
  }
}
