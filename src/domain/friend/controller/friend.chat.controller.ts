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
} from '@nestjs/common';
import { FriendService } from 'src/domain/friend/friend.service';
import { FriendListResponseDto } from 'src/domain/friend/dto/friend.list.response.dto';
import { FriendPendingListResponseDto } from 'src/domain/friend/dto/friend.pending.list.response.dto';
import { FriendDirectMessageChatListResponseDto } from 'src/domain/friend/dto/friend.direct.message.chat.list.response.dto';
import { PostFriendChatRequestDto } from 'src/domain/friend/dto/post.friend.chat.request.dto';
import { FriendDirectMessageRoomListResponseDto } from 'src/domain/friend/dto/friend.direct.message.room.list.response.dto';
import { FriendDirectMessageNewResponseDto } from 'src/domain/friend/dto/friend.direct.message.new.response';

@Controller('controller')
export class FriendChatController {
  constructor(private friendService: FriendService) {}

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
  @Get('/users/friends/:nickname/chats')
  async friendChatListGet(
    @Param('nickname') nickname: string,
    @Query('count', new DefaultValuePipe(40), ParseIntPipe) count: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<FriendDirectMessageChatListResponseDto> {
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

  @Post('/users/friends/:nickname/chats')
  async friendChatPost(
    @Param('nickname') nickname: string,
    @Body() postFriendChatRequestDto: PostFriendChatRequestDto,
  ): Promise<void> {
    return;
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

  @Get('/users/friends/chatlist')
  async friendDmListGet(): Promise<FriendDirectMessageRoomListResponseDto> {
    const friendDirectMessageRoomList: FriendDirectMessageRoomListResponseDto =
      {
        dmList: [],
      };
    return friendDirectMessageRoomList;
  }

  /* 진행 중인 DM 리스트에서 특정 방 삭제
   * DELETE /users/friends/chats/{nickname}
   * response header {
   *   200: ok;
   * }
   * */
  @Delete('/users/friends/chats/:nickname')
  async friendDirectMessageDelete(
    @Param('nickname') nickname: string,
  ): Promise<void> {
    return;
  }

  /* 새로운 DM 유무 확인
   *
   * GET /users/friends/chats/new
   * response body {
   *   hasNewChat: boolean;
   * }
   * */
  @Get('/users/friends/chats/new')
  async friendDirectMessageNewGet(): Promise<FriendDirectMessageNewResponseDto> {
    const friendDirectMessageNew: FriendDirectMessageNewResponseDto = {
      hasNewChat: true,
    };
    return friendDirectMessageNew;
  }
}
