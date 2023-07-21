import { FriendService } from '../friend/friend.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Requestor } from '../auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from '../auth/jwt/auth.user.id-card.dto';
import { FriendRequestCountResponseDto } from './dto/friend.request.count.response.dto';
import ChannelInviteListResponseDto from './dto/channel.invite.list.response.dto';
import { InvitationService } from '../invitation/invitation.service';
import { NotificationResponseDto } from './dto/notification.response.dto';

@Controller('/users/notifications')
export class NotificationController {
  constructor(
    private readonly friendService: FriendService,
    private readonly invitationService: InvitationService,
  ) {}

  /* 친구 요청 개수
   * GET /users/notifications/friends
   * response body {
   *     requestCount: number; // 친구 요청이 없으면 0 요청 최대50개만 가능
   * }
   * */
  @Get('/friends')
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
  @Get('/channels')
  @UseGuards(AuthGuard('jwt'))
  async channelInviteListGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<ChannelInviteListResponseDto> {
    const { id } = requestor;
    const { invitations } = await this.invitationService.getChannelInviteList({
      userId: id,
    });
    return { invitations };
  }

  @Get('/games')
  @UseGuards(AuthGuard('jwt'))
  async GameNotificationsGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<NotificationResponseDto> {
    const { id: userId } = requestor;
    const { invitations } = await this.invitationService.getGameInviteList({
      userId,
    });

    return { invitations };
  }
}
