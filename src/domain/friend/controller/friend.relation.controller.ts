import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FriendService } from 'src/domain/friend/friend.service';
import { FriendListResponseDto } from 'src/domain/friend/dto/friend.list.response.dto';
import { FriendPendingListResponseDto } from 'src/domain/friend/dto/friend.pending.list.response.dto';
import { FriendDirectMessageChatListResponseDto } from 'src/domain/friend/dto/friend.direct.message.chat.list.response.dto';
import { PostFriendChatRequestDto } from 'src/domain/friend/dto/post.friend.chat.request.dto';
import { FriendDirectMessageRoomListResponseDto } from 'src/domain/friend/dto/friend.direct.message.room.list.response.dto';
import { FriendDirectMessageNewResponseDto } from 'src/domain/friend/dto/friend.direct.message.new.response';
import { UserFriendsDto } from '../dto/user.friends.dto';
import { Requestor } from '../../auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from '../../auth/jwt/auth.user.id-card.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../../user/user.service';

@Controller('users/friends')
export class FriendRelationController {
  constructor(
    private friendService: FriendService,
    private userService: UserService,
  ) {}

  /* 친구 목록 조회
   * GET /users/friends
   * response body {
   * 	users: [
   * 		{
   * 			nickname: string;
   * 			imgUrl: string;
   * 		}, ...
   * 	] // 정렬 알파벳순
   * }
   * response header {
   * 	200: ok;
   * }
   * */
  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async friendListGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<FriendListResponseDto> {
    const { id } = requestor;
    const { friends }: UserFriendsDto = await this.friendService.getUserFriends(
      { userId: id },
    );
    return { users: [...friends] };
  }

  /* 친구 요청
   * POST /users/friends/pendings/{nickname}
   * response header {
   *   200: ok;
   *   400: error;
   * } // 요청을 둘다 보냈을 경우 친구 수락
   * */
  @Post('/pendings/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async friendPendingPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { id: friendId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.friendService.postUserFriendRequest({ userId, friendId });
  }

  /* 친구 요청 목록 조회 (pending list)
   * GET /users/friends/pendings
   * response body {
   *   users: [
   *     {
   *       nickname: string;
   *       imgUrl: string;
   *     }, ...
   *   ] // 정렬 알파벳순
   * }
   * response header {
   *   200: ok;
   * }
   * */
  @Get('/pendings')
  @UseGuards(AuthGuard('jwt'))
  async friendPendingListGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<FriendPendingListResponseDto> {
    const { id } = requestor;
    const { friends } = await this.friendService.getUserPendingFriendRequests({
      userId: id,
    });
    return { users: [...friends] };
  }

  /* 친구 요청 수락
   * POST /users/friends/{ nickname };
   * response header {
   * 	 200: ok;
   * }
   * */
  @Post('/:nickname')
  async friendAcceptPost(@Param('nickname') nickname: string): Promise<void> {
    return;
  }

  /* 친구 요청 거절
   * DELETE /users/friends/pendings/{ nickname };
   * response header {
   * 	 200: ok;
   * }
   * */
  @Delete('/pendings/:nickname')
  async friendRejectDelete(@Param('nickname') nickname: string): Promise<void> {
    return;
  }

  /* 친구 삭제
   * DELETE /users/friends/{nickname}
   * response header {
   *	200: ok;
   * }
   * */
  @Delete('/:nickname')
  async friendDelete(@Param('nickname') nickname: string): Promise<void> {
    return;
  }
}
