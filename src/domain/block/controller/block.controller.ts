import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BlockService } from '../block.service';
import { UserBlocksResponseDto } from '../dto/user.blocks.response.dto';

@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get('/blocks')
  async userBlocksGet(): Promise<UserBlocksResponseDto> {
    const blockList: UserBlocksResponseDto = {
      users: [],
    };
    return blockList;
  }

  @Post('/users/blocks/{nickname}')
  async userBlocksPost(@Param('nickname') nickname: string): Promise<void> {
    return;
  }

  @Delete('/users/blocks/{nickname}')
  async userBlocksDelete(@Param('nickname') nickname: string): Promise<void> {
    return;
  }
}
