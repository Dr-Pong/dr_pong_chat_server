import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BlockService } from '../block.service';
import { UserBlocksResponseDto } from '../dto/user.blocks.response.dto';
import { AuthGuard } from '@nestjs/passport';
import { Requestor } from 'src/domain/auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from 'src/domain/auth/jwt/auth.user.id-card.dto';
import { UserBlocksDto } from '../dto/user.blocks.dto';
import { UserService } from 'src/domain/user/user.service';

@Controller('/users/blocks')
export class BlockController {
  constructor(
    private readonly blockService: BlockService,
    private readonly userService: UserService,
  ) {}

  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async userBlocksGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<UserBlocksResponseDto> {
    const { id } = requestor;
    const { users }: UserBlocksDto = await this.blockService.getUserBlocks({
      userId: id,
    });
    return { users: [...users] };
  }

  @Post('/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async userBlocksPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { id: targetId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.blockService.postUserBlocks({ userId, targetId });
  }

  @Delete('/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async userBlocksDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { id: targetId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.blockService.deleteUserBlocks({ userId, targetId });
  }
}
