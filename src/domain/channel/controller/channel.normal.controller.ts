import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChannelNormalService } from '../service/channel.normal.service';
import { OrderChannelType } from '../type/type.order.channel';
import { ChannelPageResponseDto } from '../dto/channel.page.response.dto';
import { Requestor } from '../../auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from '../../auth/jwt/auth.user.id-card.dto';
import { ChannelParticipantsResponseDto } from '../dto/channel.participant.request.dto';
import { PostChannelRequestDto } from '../dto/post/post.channel.request.dto';
import { PostChannelJoinRequestDto } from '../dto/post/post.channel.join.request.dto';
import { UserService } from '../../user/user.service';
import { CHAT_MESSAGE } from '../type/type.channel.action';
import { PostChannelChatRequestDto } from '../dto/post/post.channel.chat.request.dto';
import { ChannelMeResponseDto } from '../dto/channel.me.response.dto';
import { ChannelMeDto } from '../dto/channel.me.dto';
import { ChannelChatsResponseDto } from '../dto/channel.chats.response.dto';
import { AuthGuard } from '@nestjs/passport';
import { ChannelIdResponseDto } from '../dto/channel.id.response.dto';

@Controller('/channels')
export class ChannelNormalController {
  constructor(
    private readonly userServie: UserService,
    private readonly channelService: ChannelNormalService,
  ) {}

  /* DM 대화 내역
   * GET /channels?page={page}&count={count}&order={'recent' | 'popular'}&keyword={keyword | null}
   * response body {
   * 	channels: [
   * 		{
   * 			id: string;
   * 			title: string; (중복 없음)
   * 			access: 'public' | 'protected';
   * 			headCount: number;
   * 			maxCount: number;
   * 		},
   * 	]
   * 	currentPage: number;
   * 	totalPage: number;
   * }
   * response header {
   * 	200: ok;
   * }
   * */
  @Get('/')
  async channelPageGet(
    @Query('page', ParseIntPipe) page: number,
    @Query('count', ParseIntPipe) count: number,
    @Query('order') orderBy: OrderChannelType,
    @Query('keyword') keyword: string,
  ): Promise<ChannelPageResponseDto> {
    const { channels, currentPage, totalPage } =
      await this.channelService.getChannelPages({
        page,
        count,
        orderBy,
        keyword,
      });

    return { channels, currentPage, totalPage };
  }

  /**
   * GET /channels/{roomId}/participants
   * response body {
   * 	me: {
   * 		nickname: string;
   * 		imgUrl: string;
   * 		roleType: 'owner' | 'admin' | 'normal';
   * 		isMuted: boolean;
   * 	}
   * 	participants: [
   * 		{
   * 			nickname: string;
   * 			imgUrl: string;
   * 			roleType: 'owner' | 'admin' | 'normal';
   * 			isMuted: boolean;
   * 		}...
   * 	];
   * 	headCount: number;
   * 	maxCount: number;
   * }
   * response header {
   * 	200: ok;
   * }
   */
  @Get('/:roomId/participants')
  @UseGuards(AuthGuard('jwt'))
  async channelParticipantsGet(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
  ): Promise<ChannelParticipantsResponseDto> {
    const { id: userId }: UserIdCardDto = requestor;
    const { me, participants, headCount, maxCount } =
      await this.channelService.getChannelParticipants({ userId, channelId });
    return { me, participants, headCount, maxCount };
  }

  /**
   * POST /channels
   * request body {
   * 	title: string;
   * 	access: public | private;
   * 	password: null | string;
   * 	maxCount: number;
   * }
   * response header {
   * 	200: ok;
   * 	400: title taken;
   * }
   */
  @Post('/')
  @UseGuards(AuthGuard('jwt'))
  async channelPost(
    @Requestor() requestor: UserIdCardDto,
    @Body() requestDto: PostChannelRequestDto,
  ): Promise<ChannelIdResponseDto> {
    const { id: userId } = requestor;
    const { title, access, password, maxCount } = requestDto;

    return await this.channelService.postChannel({
      userId,
      title,
      access,
      password,
      maxCount,
    });
  }

  /**
   * POST /channels/{roomId}/participants
   * request body {
   *     password: null | string;
   * }
   * response header {
   * 	200: ok;
   * 	400: full bang | wrong password | private | no bang;
   * }
   */
  @Post('/:roomId/participants')
  @UseGuards(AuthGuard('jwt'))
  async channelParticipantPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Body() requestDto: PostChannelJoinRequestDto,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { password } = requestDto;
    await this.channelService.postChannelJoin({ userId, channelId, password });
  }

  /**
   * DELETE /channels/{roomId}/participants
   * response header {
   * 	200: ok;
   * 	400: no bang;
   * }
   */
  @Delete('/:roomId/participants')
  @UseGuards(AuthGuard('jwt'))
  async channelParticipantDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    await this.channelService.deleteChannelUser({ userId, channelId });
  }

  /**
   * POST /channels/{roomId}/invitation/{nickname}
   * response header {
   * 	200: ok;
   * 	400: no bang;
   * }
   */
  @Post('/:roomId/invitation/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async channelInvitationPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { id: targetId } = await this.userServie.getIdFromNickname({
      nickname,
    });
    await this.channelService.postInvite({ userId, channelId, targetId });
  }

  /**
   * POST /channels/{roomId}/magicpass
   * response header {
   * 	200: ok;
   *     400: full bang | no bang;
   * }
   */
  @Post('/:roomId/magicpass')
  @UseGuards(AuthGuard('jwt'))
  async channelMagicPassPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    await this.channelService.postChannelAcceptInvite({ userId, channelId });
  }

  /**
   * DELETE /channels/{roomId}/invitation
   * response header {
   *   200: ok;
   * 400: error;
   * }
   */
  @Delete('/:roomId/invitation')
  @UseGuards(AuthGuard('jwt'))
  async channelInvitationDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    await this.channelService.deleteChannelInvite({ userId, channelId });
  }

  /**
   * POST /channels/{roomId}/chats
   * response body {
   * 	message: string;
   * }
   * response header {
   * 	200: ok;
   * 	400: no bang;
   * }
   */
  @Post('/:roomId/chats')
  @UseGuards(AuthGuard('jwt'))
  async channelChatPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Body() requestDto: PostChannelChatRequestDto,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { message: content } = requestDto;
    const type = CHAT_MESSAGE;
    await this.channelService.postChannelMessage({
      userId,
      channelId,
      content,
      type,
    });
  }

  /**
   * GET /channels/me
   * response body {
   * 	myChannel: {
   * 		id: string;
   * 		title: string; (중복 없음)
   * 		headCount: number;
   * 		maxCount: number;
   * 	} | null;
   * }
   * response header {
   * 	200: ok;
   * }
   */
  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  async channelMeGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<ChannelMeResponseDto> {
    const { id: userId }: UserIdCardDto = requestor;
    const myChannel: ChannelMeDto = await this.channelService.getChannelMy({
      userId,
    });
    return { myChannel };
  }

  /**
   * GET /channels/{roomId}chats?offset={offset}&count={count}
   * response body {
   * 	chats: [
   * 		{
   * 			id: number;
   * 			message: string; // system인 경우 'mute' | 'unmute' | 'setadmin' | 'unsetadmin' | 'kick' | 'ban' | 'join' | 'leave'
   * 			nickname: string; // system일 경우 당한사람
   * 			time: Date;
   * 			type: 'me' | 'others' | 'system';
   * 		}, ...
   * 	],
   * 	isLastPage: boolean;
   * }
   * response header {
   * 	200: ok;
   * }
   */
  @Get('/:roomId/chats')
  @UseGuards(AuthGuard('jwt'))
  async channelChatsGet(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('count', ParseIntPipe) count: number,
  ): Promise<ChannelChatsResponseDto> {
    const { id: userId } = requestor;
    if (!offset) offset = 2147483647;
    const { chats, isLastPage } =
      await this.channelService.getChannelMessageHistory({
        userId,
        channelId,
        offset,
        count,
      });
    return { chats, isLastPage };
  }
}
