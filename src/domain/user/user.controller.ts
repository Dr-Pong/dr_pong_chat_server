import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRelationResponseDto } from './dto/user.relation.response.dto';
import { PostGatewayUserDto } from './dto/post.gateway.users.dto';
import { AuthGuard } from '@nestjs/passport';
import { Requestor } from '../auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from '../auth/jwt/auth.user.id-card.dto';
import { FriendRequestCountResponseDto } from './dto/friend.request.count.response.dto';
import { FriendService } from '../friend/friend.service';
import { ChannelNormalService } from '../channel/service/channel.normal.service';
import ChannelInviteListResponseDto from './dto/channel.invite.list.response.dto';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly friendService: FriendService,
    private readonly channelService: ChannelNormalService,
  ) {}

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

  /* 친구 요청 개수
   * GET /users/notifications/friends
   * response body {
   *     requestCount: number; // 친구 요청이 없으면 0 요청 최대50개만 가능
   * }
   * */
  @Get('/notifications/friends')
  @UseGuards(AuthGuard('jwt'))
  async friendRequestCountGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<FriendRequestCountResponseDto> {
    const { id } = requestor;
    const { requestCount } =
      await this.friendService.getUserFriendNotificationCount({
        userId: id,
      });
    return { requestCount };
  }

  /* 채널 초대
   * GET /users/notifications/channels
   * response body {
   *     invitations: [
   *         {
   *             id: string;
   *             channelId: number;
   *             channelName: string;
   *             from: string;
   *             createdAt: date;
   *         },
   *         ...
   *     ]
   * }
   * */
  @Get('/notifications/channels')
  @UseGuards(AuthGuard('jwt'))
  async channelInviteListGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<ChannelInviteListResponseDto> {
    const { id } = requestor;
    const { invitations } = await this.channelService.getChannelInviteList({
      userId: id,
    });
    return { invitations };
  }

  /*
   * 채널 초대 삭제
   * DELETE /users/notifications/channels/{id}
   * response header {
   *     200: ok;
   *     400: error;
   * }
   * */
  @Delete('/notifications/channels/:id')
  @UseGuards(AuthGuard('jwt'))
  async channelInvitationDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('id') id: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    await this.channelService.deleteChannelInvite({ userId, channelId: id });
  }

  @Post('/')
  async userPost(@Body() postDto: PostGatewayUserDto): Promise<void> {
    await this.userService.postUser(postDto);
  }
}
