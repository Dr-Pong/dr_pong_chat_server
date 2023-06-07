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

  /** 차단목록 GET
   * 특정 사용자의 차단 목록을 조회하는 함수입니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getUserBlocks(getDto: GetUserBlocksDto): Promise<UserBlocksDto> {
    // 사용자의 차단 목록을 찾습니다.
    const unsortedBlockedUsers: Block[] =
      await this.blockRepository.findBlocksByUserId(getDto.userId);

    // 차단된 사용자 정보를 가공합니다.
    const blockedUsers: BlockUserInfoDto[] = unsortedBlockedUsers.map(
      (block) => {
        return {
          nickname: block.blockedUser.nickname,
          imgUrl: block.blockedUser.image.url,
        };
      },
    );

    // 닉네임을 기준으로 차단된 사용자를 정렬합니다.
    blockedUsers.sort((a, b) => {
      if (a.nickname > b.nickname) {
        return 1;
      }
      if (a.nickname < b.nickname) {
        return -1;
      }
      return 0;
    });

    // 응답용 DTO를 생성하여 반환합니다.
    const responseDto: UserBlocksDto = {
      users: blockedUsers,
    };
    return responseDto;
  }
}
