import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Requestor } from '../auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from '../auth/jwt/auth.user.id-card.dto';
import { InvitationService } from './invitation.service';
import { UserService } from '../user/user.service';
import { GameInviteAcceptDto } from './dto/game.invite.accept.dto';
import { PostGameInviteAcceptDto } from './dto/post.game.invite.accept.dto';
import { PostGameInviteDto } from './dto/post.game.invite.dto';
import { GameInviteAcceptResponseDto } from './dto/game.invite.accept.response.dto';
import { DeleteGameInviteRejectDto } from './dto/delete.game.invite.reject.dto';
import { DeleteGameInviteDto } from './dto/delete.game.invite.dto';
import { GameMode } from '../../global/type/type.game';

@Controller('invitations')
export class InvitationController {
  constructor(
    private readonly inviteService: InvitationService,
    private readonly userService: UserService,
  ) {}

  /**
   * POST /invitations/channels/{roomId}/{nickname}
   * response header {
   * 	200: ok;
   * 	400: no bang;
   * }
   */
  @Post('channels/:roomId')
  @UseGuards(AuthGuard('jwt'))
  async channelInvitationPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Body('nickname') nickname: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { id: targetId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.inviteService.postChannelInvite({ userId, channelId, targetId });
  }

  /**
   * POST /channels/{roomId}/magicpass
   * response header {
   * 	200: ok;
   *     400: full bang | no bang;
   * }
   */
  @Patch('/channels/:roomId')
  @UseGuards(AuthGuard('jwt'))
  async channelInvitationPatch(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    await this.inviteService.postChannelAcceptInvite({ userId, channelId });
  }

  /**
   * DELETE /invitations/channels/{roomId}
   * response header {
   *   200: ok;
   * 400: error;
   * }
   */
  @Delete('/channels/:roomId')
  @UseGuards(AuthGuard('jwt'))
  async channelInvitationDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    await this.inviteService.deleteChannelInvite({ userId, channelId });
  }

  /**
   * POST /invitations/games
   * response header {
   *   200: ok;
   *   400: error;
   * }
   */
  @Post('/games')
  @UseGuards(AuthGuard('jwt'))
  async gameInvitePost(
    @Requestor() requestor: UserIdCardDto,
    @Body() body: { nickname: string; mode: GameMode },
  ): Promise<void> {
    const { id: userId } = requestor;
    const { nickname, mode } = body;
    const { id: targetId } = await this.userService.getIdFromNickname({
      nickname,
    });
    const postDto = new PostGameInviteDto(userId, targetId, mode);
    await this.inviteService.postGameInvite(postDto);
  }

  /**
   * DELETE /invitations/games
   * response header {
   *  200: ok;
   * 400: error;
   * }
   */
  @Delete('/games')
  @UseGuards(AuthGuard('jwt'))
  async gameInviteDelete(@Requestor() requestor: UserIdCardDto): Promise<void> {
    const { id: userId } = requestor;
    const deleteDto = new DeleteGameInviteDto(userId);
    await this.inviteService.deleteGameInvite(deleteDto);
  }

  /**
   * PATCH /invitations/games/{id}
   * response header {
   *  200: ok;
   *  400: error;
   * }
   * response body {
   *  gameId: string;
   * }
   */
  @Patch('/games/:id')
  @UseGuards(AuthGuard('jwt'))
  async gameInviteAcceptPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('id') id: string,
  ): Promise<GameInviteAcceptDto> {
    const { id: userId } = requestor;
    const postDto = new PostGameInviteAcceptDto(userId, id);
    const newGame: GameInviteAcceptDto =
      await this.inviteService.postGameInviteAccept(postDto);
    return new GameInviteAcceptResponseDto(newGame.gameId);
  }

  /**
   * DELETE /invitations/games/{id}
   * response header {
   *  200: ok;
   *  400: error;
   * }
   */
  @Delete('/games/:id')
  @UseGuards(AuthGuard('jwt'))
  async gameInviteRejectDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('id') id: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    const deleteDto = new DeleteGameInviteRejectDto(userId, id);
    await this.inviteService.deleteGameInviteReject(deleteDto);
  }
}
