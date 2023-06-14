import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserService } from '../user.service';
import { UserRelationResponseDto } from '../dto/user.relation.response.dto';
import { PostGatewayUserDto } from '../dto/post.gateway.users.dto';
import { Requestor } from '../../auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from '../../auth/jwt/auth.user.id-card.dto';
import { PatchUserImageRequestDto } from '../dto/patch.user.image.request.dto';
import { PatchUserImageDto } from '../dto/patch.user.image.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/:nickname/relations/:targetNickname')
  async userRelationGet(
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

  @Post('/')
  async userPost(@Body() postDto: PostGatewayUserDto): Promise<void> {
    await this.userService.postUser(postDto);
  }

  @Patch('/:nickname/image')
  async usersImageByNicknamePatch(
    @Requestor() requestor: UserIdCardDto,
    @Param('nickname') nickname: string,
    @Body()
    patchRequestDto: PatchUserImageRequestDto,
  ): Promise<void> {
    await this.userService.patchUserImage({
      userId: requestor.id,
      imgId: patchRequestDto.imgId,
    });
  }
}
