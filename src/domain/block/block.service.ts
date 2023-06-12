import { BadRequestException, Injectable } from '@nestjs/common';
import { BlockRepository } from './block.repository';
import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
} from 'typeorm-transactional';
import { UserBlocksDto } from './dto/user.blocks.dto';
import { GetUserBlocksDto } from './dto/get.user.blocks.dto';
import { Block } from './block.entity';
import { BlockUserInfoDto } from './dto/user.blocks.dto';
import { PostUserBlockDto } from './dto/post.user.block.dto';
import { UserModel } from '../factory/model/user.model';
import { UserFactory } from '../factory/user.factory';
import { DeleteUserBlockDto } from './dto/delete.user.block.dto';
import { SortUtil } from '../../global/utils/sort.util';

@Injectable()
export class BlockService {
  constructor(
    private readonly blockRepository: BlockRepository,
    private readonly userFactory: UserFactory,
  ) {}

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
    blockedUsers.sort(SortUtil.byNicknames);

    // 응답용 DTO를 생성하여 반환합니다.
    const responseDto: UserBlocksDto = {
      users: blockedUsers,
    };
    return responseDto;
  }

  /** 유저 차단 POST
   * 특정 사용자를 차단하는 함수입니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postUserBlocks(postDto: PostUserBlockDto): Promise<void> {
    const { userId, targetId } = postDto;
    // 차단당할 사용자가 유효한지 확인합니다.
    const validUser: UserModel = this.userFactory.findById(targetId);
    if (!validUser) {
      throw new BadRequestException('Invalid userId');
    }
    // 차단당할 사용자를 차단목록에 존재하는지 찾습니다.
    const blockedUser: Block =
      await this.blockRepository.findBlockByUserIdAndTargetId(userId, targetId);

    // 차단당할 사용자가 차단목록에 있다면 차단하지 않습니다.
    if (blockedUser) {
      return;
    }
    // 차단당할 사용자가 차단목록에 없다면 차단합니다.DB
    await this.blockRepository.createUserBlock(userId, targetId);

    // 차단당할 사용자가 차단목록에 없다면 차단합니다. Factory
    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(userId);
      this.userFactory.block(userModel.id, targetId);
    });
  }

  /** 유저 차단 DELETE
   * 특정 사용자를 차단 해제하는 함수입니다.
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteUserBlocks(deleteDto: DeleteUserBlockDto): Promise<void> {
    const { userId, targetId } = deleteDto;
    // 차단 해제할 사용자를 차단목록에 존재하는지 찾습니다.
    const blockedUser: Block =
      await this.blockRepository.findBlockByUserIdAndTargetId(userId, targetId);

    // 차단 해제할 사용자가 차단목록에 없다면 에러를 반환합니다.
    if (!blockedUser) {
      throw new BadRequestException('Invalid userId');
    }
    // 차단 해제할 사용자가 차단목록에 있다면 차단을 해제합니다.
    await this.blockRepository.deleteUserBlock(userId, targetId);

    // 차단 해제할 사용자가 차단목록에 있다면 차단을 해제합니다. Factory
    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(userId);
      this.userFactory.unblock(userModel.id, targetId);
    });
  }
}
