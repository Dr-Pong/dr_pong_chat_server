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
import { FriendDmChatlistResponseDto } from 'src/domain/friend/dto/friend.dm.chatlist.response.dto';
import { PostFriendChatDto } from 'src/domain/friend/dto/post.friend.chat.dto';
import { FriendDmRoomListResponseDto } from 'src/domain/friend/dto/friend.dm.room.list.response.dto';
import { FriendDmNewResponseDto } from 'src/domain/friend/dto/friend.dm.new.response';

@Controller('controller')
export class FriendController {
  constructor(private friendService: FriendService) {}

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
  @Get('/users/friends')
  async friendListGet(): Promise<FriendListResponseDto> {
    const friendList: FriendListResponseDto = {};
    return friendList;
  }

  /* 친구 요청
   * POST /users/friends/pendings/{nickname}
   * response header {
   *   200: ok;
   *   400: error;
   * } // 요청을 둘다 보냈을 경우 친구 수락
   * */
  @Post('/users/friends/pendings/:nickname')
  async friendPendingPost(@Param('nickname') nickname: string): Promise<void> {}

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
  @Get('/users/friends/pendings')
  async friendPendingListGet(): Promise<FriendPendingListResponseDto> {
    const friendPendingList: FriendPendingListResponseDto = {};
    return friendPendingList;
  }

  /* 친구 요청 수락
   * POST /users/friends/{ nickname };
   * response header {
   * 	 200: ok;
   * }
   * */
  @Post('/users/friends/:nickname')
  async friendAcceptPost(@Param('nickname') nickname: string): Promise<void> {}

  /* 친구 요청 거절
   * DELETE /users/friends/pendings/{ nickname };
   * response header {
   * 	 200: ok;
   * }
   * */
  @Delete('/users/friends/pendings/:nickname')
  async friendRejectDelete(
    @Param('nickname') nickname: string,
  ): Promise<void> {}

  /* 친구 삭제
   * DELETE /users/friends/{nickname}
   * response header {
   *	200: ok;
   * }
   * */
  @Delete('/users/friends/:nickname')
  async friendDelete(@Param('nickname') nickname: string): Promise<void> {}

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
  ): Promise<FriendDmChatlistResponseDto> {
    const friendDmChatlist: FriendDmChatlistResponseDto = {};
    return friendDmChatlist;
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
    @Body() postFriendChatDto: PostFriendChatDto,
  ): Promise<void> {}

  /* 진행 중인 DM 목록 받기
   * GET /users/friends/chatlist
   * response body {
   * 	 chatList: [
   *     {
   *       nickname: string;
   *       imgUrl: string;
   *       newChats: number;
   *     }
   *   ]...;
   * }
   * */

  @Get('/users/friends/chatlist')
  async friendDmListGet(): Promise<FriendDmRoomListResponseDto> {
    const friendDmRoomList: FriendDmRoomListResponseDto = {};
    return friendDmRoomList;
  }

  /* 진행 중인 DM 리스트에서 특정 방 삭제
   * DELETE /users/friends/chats/{nickname}
   * response header {
   *   200: ok;
   * }
   * */
  @Delete('/users/friends/chats/:nickname')
  async friendDmDelete(@Param('nickname') nickname: string): Promise<void> {}

  /* 새로운 DM 유무 확인
   *
   * GET /users/friends/chats/new
   * response body {
   *   hasNewChat: boolean;
   * }
   * */
  @Get('/users/friends/chats/new')
  async friendDmNewGet(): Promise<FriendDmNewResponseDto> {
    const friendDmNew: FriendDmNewResponseDto = {};
    return friendDmNew;
  }
}
