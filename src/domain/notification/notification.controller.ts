import { FriendService } from '../friend/friend.service';
import { ChannelNormalService } from '../channel/service/channel.normal.service';
import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Requestor } from '../auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from '../auth/jwt/auth.user.id-card.dto';
import { FriendRequestCountResponseDto } from '../user/dto/friend.request.count.response.dto';
import ChannelInviteListResponseDto from '../user/dto/channel.invite.list.response.dto';

@Controller('users/notifications')
export class NotificationController {
  constructor(
    private readonly friendService: FriendService,
    private readonly channelService: ChannelNormalService,
  ) {}

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
}
