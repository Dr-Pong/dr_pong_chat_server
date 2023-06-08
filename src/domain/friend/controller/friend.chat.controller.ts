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
import { FriendDirectMessageChatListResponseDto } from 'src/domain/friend/dto/friend.direct.message.chat.list.response.dto';
import { PostFriendChatRequestDto } from 'src/domain/friend/dto/post.friend.chat.request.dto';
import { FriendDirectMessageRoomListResponseDto } from 'src/domain/friend/dto/friend.direct.message.room.list.response.dto';
import { FriendDirectMessageNewResponseDto } from 'src/domain/friend/dto/friend.direct.message.new.response';
import { AuthGuard } from '@nestjs/passport';
import { Requestor } from '../../auth/jwt/auth.requestor.decorator';
import { UserIdCardDto } from '../../auth/jwt/auth.user.id-card.dto';
import { UserService } from '../../user/user.service';
import { DirectMessageService } from '../../direct-message/direct-message.service';
import { DirectMessageRoomService } from '../../direct-message-room/direct-message-room.service';

@Controller('/users/friends')
export class FriendChatController {
  constructor(
    private directMessageService: DirectMessageService,
    private directMessageRoomService: DirectMessageRoomService,
    private userService: UserService,
  ) {}

  /* DM 대화 내역
   * GET /users/friends/{nickname}/chats?offset={offset}&count={count}
   * response body {
   * chatList: [
   *   {
   *     id: number;
   *     message: string;
   *     nickname: string;
   *     createdAt: Date;
   *   }, ...
   * ],
   *   isLastPage: boolean;
   * }
   * response header {
   *   200: ok;
   * }
   * */
  @Get('/:nickname/chats')
  @UseGuards(AuthGuard('jwt'))
  async friendChatListGet(
    @Requestor() requestor: UserIdCardDto,
    @Param('nickname') nickname: string,
    @Query('count', new DefaultValuePipe(40), ParseIntPipe) count: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<FriendDirectMessageChatListResponseDto> {
    const { id: userId } = requestor;
    const { id: friendId } = await this.userService.getIdFromNickname({
      nickname,
    });
    const friendDirectMessageChatList: FriendDirectMessageChatListResponseDto =
      {
        chatList: [],
        isLastPage: true,
      };
    return friendDirectMessageChatList;
  }

  /* DM 전송
   * POST /users/friends/{nickname}/chats
   * request body {
   *   message: string;
   * }
   * response header {
   *   200: ok;
   *   400: not friend;
   * }
   * */

  @Post('/:nickname/chats')
  @UseGuards(AuthGuard('jwt'))
  async friendChatPost(
    @Requestor() requestor: UserIdCardDto,
    @Param('nickname') nickname: string,
    @Body() postFriendChatRequestDto: PostFriendChatRequestDto,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { id: friendId } = await this.userService.getIdFromNickname({
      nickname,
    });
    const { message } = postFriendChatRequestDto;
    await this.directMessageService.postDirectMessage({
      userId,
      friendId,
      message,
    });
  }

  /* 진행 중인 DM 목록 받기
   * GET /users/friends/chatlist
   * response body {
   * 	 dmList: [
   *     {
   *       nickname: string;
   *       imgUrl: string;
   *       newChats: number;
   *     }
   *   ]...;
   * }
   * */

  @Get('/chatlist')
  @UseGuards(AuthGuard('jwt'))
  async friendDirectMessageListGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<FriendDirectMessageRoomListResponseDto> {
    const { id: userId } = requestor;
    const { chatList } =
      await this.directMessageRoomService.getAllDirectMessageRooms({
        userId,
      });
    return {
      chatList: chatList.map((chat) => {
        return { ...chat };
      }),
    };
  }

  /* 진행 중인 DM 리스트에서 특정 방 삭제
   * DELETE /users/friends/chats/{nickname}
   * response header {
   *   200: ok;
   * }
   * */
  @Delete('/chats/:nickname')
  @UseGuards(AuthGuard('jwt'))
  async friendDirectMessageDelete(
    @Requestor() requestor: UserIdCardDto,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    const { id: userId } = requestor;
    const { id: friendId } = await this.userService.getIdFromNickname({
      nickname,
    });
    await this.directMessageRoomService.deleteDirectMessageRoom({
      userId,
      friendId,
    });
  }

  /* 새로운 DM 유무 확인
   *
   * GET /users/friends/chats/new
   * response body {
   *   hasNewChat: boolean;
   * }
   * */
  @Get('/chats/new')
  @UseGuards(AuthGuard('jwt'))
  async friendDirectMessageNewGet(
    @Requestor() requestor: UserIdCardDto,
  ): Promise<FriendDirectMessageNewResponseDto> {
    const { id: userId } = requestor;
    const { hasNewChat } =
      await this.directMessageRoomService.getDirectMessageRoomsNotification({
        userId,
      });
    return { hasNewChat };
  }
}
