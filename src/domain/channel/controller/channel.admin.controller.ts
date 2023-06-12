import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChannelAdminService } from '../service/channel.admin.service';
import { UserService } from '../../user/user.service';
import { AuthGuard } from '@nestjs/passport';
import { UserIdCardDto } from '../../auth/jwt/auth.user.id-card.dto';
import { Requestor } from '../../auth/jwt/auth.requestor.decorator';
import { ChannelPatchRequestDto } from '../dto/patch/channel.patch.request.dto';
import { PostChannelAdminDto } from '../dto/post/post.channel.admin.dto';
import { PostChannelBanDto } from '../dto/post/post.channel.ban.dto';
import { DeleteChannelKickDto } from '../dto/delete/delete.channel.kick.dto';
import { PostChannelMuteDto } from '../dto/post/post.channel.mute.dto';
import { DeleteChannelMuteDto } from '../dto/delete/delete.channel.mute.dto';
import { DeleteChannelAdminDto } from '../dto/delete/delete.channel.admin.dto';

@Controller('/channels')
export class ChannelAdminController {
  constructor(
    private readonly channelAdminService: ChannelAdminService,
    private readonly userService: UserService,
  ) {}

  @Patch('/:roomId')
  @UseGuards(AuthGuard('jwt'))
  async channelPatch(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Body() requestDto: ChannelPatchRequestDto,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { password, access } = requestDto;
    await this.channelAdminService.patchChannel({
      userId,
      channelId,
      password,
      access,
    });
  }

  @Delete('/:roomId')
  @UseGuards(AuthGuard('jwt'))
  async channelDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    await this.channelAdminService.deleteChannel({ userId, channelId });
  }

  @Post('/:roomId/admin/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async channelAdminPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: requestUserId } = requestor;
    const { id: targetUserId } = await this.userService.getIdFromNickname({
      nickname,
    });

    await this.channelAdminService.postChannelAdmin(
      new PostChannelAdminDto(requestUserId, channelId, targetUserId),
    );
  }

  @Delete('/:roomId/admin/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async channelAdminDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: requestUserId } = requestor;
    const { id: targetUserId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.channelAdminService.deleteChannelAdmin(
      new DeleteChannelAdminDto(requestUserId, channelId, targetUserId),
    );
  }

  @Post('/:roomId/ban/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async channelBanPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: requestUserId } = requestor;
    const { id: targetUserId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.channelAdminService.postChannelBan(
      new PostChannelBanDto(requestUserId, channelId, targetUserId),
    );
  }

  @Delete('/:roomId/kick/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async channelKickDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: requestUserId } = requestor;
    const { id: targetUserId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.channelAdminService.deleteChannelKick(
      new DeleteChannelKickDto(requestUserId, channelId, targetUserId),
    );
  }

  @Post('/:roomId/mute/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async channelMutePost(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: requestUserId } = requestor;
    const { id: targetUserId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.channelAdminService.postChannelMute(
      new PostChannelMuteDto(requestUserId, channelId, targetUserId),
    );
  }

  @Delete('/:roomId/mute/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async channelMuteDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('roomId') channelId: string,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: requestUserId } = requestor;
    const { id: targetUserId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.channelAdminService.deleteChannelMute(
      new DeleteChannelMuteDto(requestUserId, channelId, targetUserId),
    );
  }
}
