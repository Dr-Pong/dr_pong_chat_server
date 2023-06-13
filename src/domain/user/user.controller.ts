import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRelationResponseDto } from './dto/user.relation.response.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/:nickname/relations/:targetNickname')
  async getUserRelation(
    @Param('nickname') nickname: string,
    @Param('targetNickname') targetNickname: string,
  ): Promise<UserRelationResponseDto> {
    const userId: number = (
      await this.userService.getIdFromNickname({
        nickname,
      })
    ).id;
    const targetId: number = (
      await this.userService.getIdFromNickname({
        nickname: targetNickname,
      })
    ).id;

    return await this.userService.getUserRelation({
      userId,
      targetId,
    });
  }
}
