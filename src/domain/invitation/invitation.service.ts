import { BadRequestException, Injectable } from '@nestjs/common';
import { UserFactory } from '../factory/user.factory';
import { UserModel } from '../factory/model/user.model';
import { PostChannelInviteDto } from './dto/post.invite.dto';
import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
} from 'typeorm-transactional';
import { PostChannelAcceptInviteDto } from './dto/post.channel.accept.invite.dto';
import { ChannelModel } from '../factory/model/channel.model';
import { ChannelFactory } from '../factory/channel.factory';
import {
  checkChannelExist,
  checkUserIsInvited,
  validateChannelJoin,
} from '../channel/validation/validation.channel';
import { ChannelInviteModel } from '../factory/model/channel.invite.model';
import { ChannelGateWay } from 'src/gateway/channel.gateway';
import { JOIN_CHANNEL_INVITE } from '../channel/type/type.join.channel';
import { ChannelJoinDto } from '../channel/dto/channel.join.dto';
import { ChannelUser } from '../channel/entity/channel-user.entity';
import { ChannelUserRepository } from '../channel/repository/channel-user.repository';
import { ChannelExitDto } from '../channel/dto/channel.exit.dto';
import { ChannelRepository } from '../channel/repository/channel.repository';
import { ChannelMessageRepository } from '../channel/repository/channel-message.repository';
import { SaveChannelMessageDto } from '../channel/dto/post/save.channel-message.dto';
import { UpdateChannelHeadCountDto } from '../channel/dto/patch/update.channel.headcount.dto';
import { SaveChannelUserDto } from '../channel/dto/post/save.channel-user.dto';
import { GameInviteAcceptResponseDto } from './dto/game.invite.accept.response.dto';
import { DeleteGameInviteRejectDto } from './dto/delete.game.invite.reject.dto';
import { PostGameInviteAcceptDto } from './dto/post.game.invite.accept.dto';
import { DeleteGameInviteDto } from './dto/delete.game.invite.dto';
import { PostGameInviteDto } from './dto/post.game.invite.dto';
import { DeleteChannelInviteDto } from '../channel/dto/delete/delete.channel.invite.dto';
import GetChannelInviteListDto from '../channel/dto/get/get.channel.invitation.list.dto';
import ChannelInviteListDto from './dto/channel.invite.list.dto';
import { GetGameInvitesDto } from './dto/get.game.invites.dto';
import {
  checkAlreadyInGame,
  checkAlreadyInvited,
  validateInvite,
  validateUser,
} from './validation/validation.invite';
import GameInviteListDto from './dto/game.invite.list.dto';
import { GameInviteModel } from '../factory/model/game.invite.model';
import axios from 'axios';
import { GameModel } from '../factory/model/game.model';
import { GAMETYPE_NORMAL } from 'src/global/type/type.game';
import { NotificationGateWay } from 'src/gateway/notification.gateway';
import { ChannelMessage } from '../channel/entity/channel-message.entity';

@Injectable()
export class InvitationService {
  constructor(
    private readonly userFactory: UserFactory,
    private readonly channelFactory: ChannelFactory,
    private readonly channelGateWay: ChannelGateWay,
    private readonly notificationGateWay: NotificationGateWay,
    private readonly channelRepository: ChannelRepository,
    private readonly messageRepository: ChannelMessageRepository,
    private readonly channelUserRepository: ChannelUserRepository,
  ) {}

  /**
   * 유저가 받은 채널 초대 목록을 보여주는 함수
   * userModel의 invite를 조회해 보내준다
   * */
  async getChannelInviteList(
    getDto: GetChannelInviteListDto,
  ): Promise<ChannelInviteListDto> {
    const invites: ChannelInviteModel[] = this.userFactory.getChannelInvites(
      getDto.userId,
    );
    return { invitations: invites };
  }

  /**
   * 채널 초대를 거절하는 함수
   * userModel의 invite에서 해당 채널을 삭제한다
   * */
  async deleteChannelInvite(deleteDto: DeleteChannelInviteDto): Promise<void> {
    const user: UserModel = this.userFactory.findById(deleteDto.userId);
    this.userFactory.deleteChannelInvite(user.id, deleteDto.channelId);
  }

  async getGameInviteList(
    getDto: GetGameInvitesDto,
  ): Promise<GameInviteListDto> {
    const user: UserModel = this.userFactory.findById(getDto.userId);
    const invites = [];
    user.gameInviteList.forEach((invite) => {
      const sender: UserModel = this.userFactory.findById(invite.senderId);
      invites.push({
        id: invite.id,
        from: sender.nickname,
        createdAt: invite.createdAt,
      });
    });
    return { invitations: invites };
  }

  /**
   * 유저를 채널에 초대하는 함수
   * 이미 초대된 유저라면 아무 일도 일어나지 않는다
   * UserModel의 inviteList에 추가해준다
   */
  async postChannelInvite(postDto: PostChannelInviteDto): Promise<void> {
    const channel: ChannelModel = this.channelFactory.channels.get(
      postDto.channelId,
    );
    checkChannelExist(channel);

    const host: UserModel = this.userFactory.findById(postDto.userId);

    const invite: ChannelInviteModel = new ChannelInviteModel(
      channel.id,
      channel.name,
      host.nickname,
    );

    this.notificationGateWay.inviteChannel(postDto.targetId, invite);
  }

  /**
   * 유저가 채널 초대를 수락하는 함수
   * 입장 성공 시 기존에 있던 채널에서는 자동 퇴장처리된다
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannelAcceptInvite(
    postDto: PostChannelAcceptInviteDto,
  ): Promise<void> {
    const user: UserModel = this.userFactory.findById(postDto.userId);
    const channel: ChannelModel = this.channelFactory.findById(
      postDto.channelId,
    );

    checkChannelExist(channel);
    checkUserIsInvited(user, postDto.channelId);
    this.userFactory.deleteChannelInvite(postDto.userId, postDto.channelId);

    await this.exitIfUserIsInChannel(postDto.userId);

    const message: ChannelMessage = await this.joinChannel(
      new ChannelJoinDto(
        postDto.userId,
        postDto.channelId,
        null,
        JOIN_CHANNEL_INVITE,
      ),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelGateWay.joinChannel(
        postDto.userId,
        postDto.channelId,
        message.id,
      );
    });
  }

  async postGameInvite(postDto: PostGameInviteDto): Promise<void> {
    const { senderId, receiverId, mode } = postDto;
    const sendUser: UserModel = this.userFactory.findById(senderId);
    const receivedUser: UserModel = this.userFactory.findById(receiverId);
    validateUser(sendUser, receivedUser);
    checkAlreadyInvited(receivedUser, senderId);
    checkAlreadyInGame(receivedUser);
    const newInvite: GameInviteModel = new GameInviteModel(
      sendUser.id,
      receivedUser.id,
      mode,
    );
    await this.notificationGateWay.inviteGame(senderId, newInvite);
  }

  async deleteGameInviteCancel(deleteDto: DeleteGameInviteDto): Promise<void> {
    await this.notificationGateWay.cancelGameInvite(deleteDto?.senderId);
  }

  async postGameInviteAccept(
    postDto: PostGameInviteAcceptDto,
  ): Promise<GameInviteAcceptResponseDto> {
    const { userId, inviteId } = postDto;
    const acceptUser: UserModel = this.userFactory.findById(userId);
    const invitation: GameInviteModel = acceptUser.gameInviteList.get(inviteId);
    validateInvite(invitation);
    acceptUser.playingGame = await this.postGameFromInvitation(invitation);
    this.userFactory.deleteGameInviteBySenderId(invitation.senderId);
    return new GameInviteAcceptResponseDto(acceptUser.playingGame.id);
  }

  async deleteGameInviteReject(
    deleteDto: DeleteGameInviteRejectDto,
  ): Promise<void> {
    const { userId, inviteId } = deleteDto;
    const receiver: UserModel = this.userFactory.findById(userId);
    const invitation: GameInviteModel = receiver.gameInviteList.get(inviteId);

    const sender: UserModel = this.userFactory.findById(invitation?.senderId);
    await this.notificationGateWay.rejectGameInvite(sender.id);
  }

  /**
   * 채널입장 처리하는 함수
   * 에러 처리, DB save, update 처리용 함수
   * 에러 케이스 - 채널이 없는 경우, 비밀번호가 틀린 경우, 인원이 꽉 찬 경우, 채널에서 BAN된 경우
   * channelUser - 유저가 채널에 입장한 것을 저장한다
   * channel - 채널의 인원수를 업데이트한다
   * message - 채널 입장 메시지를 저장한다
   * */
  private async joinChannel(dto: ChannelJoinDto): Promise<ChannelMessage> {
    await validateChannelJoin(dto, this.channelRepository, this.channelFactory);

    await this.channelUserRepository.save(
      new SaveChannelUserDto(dto.userId, dto.channelId),
    );
    await this.channelRepository.updateHeadCount(
      new UpdateChannelHeadCountDto(dto.channelId, 1),
    );
    return await this.messageRepository.save(
      SaveChannelMessageDto.fromJoinDto(dto),
    );
  }

  /**
   * 채널퇴장 처리하는 함수
   * DB delete, update 처리용 함수
   * channelUser - 유저가 채널에 퇴장한 것을 저장한다
   * channel - 채널의 인원수를 업데이트한다
   * message - 채널 퇴장 메시지를 저장한다
   * */
  private async exitChannel(dto: ChannelExitDto): Promise<ChannelMessage> {
    await this.channelUserRepository.deleteByUserIdAndChannelId(
      dto.userId,
      dto.channelId,
    );
    await this.channelRepository.updateHeadCount(
      new UpdateChannelHeadCountDto(dto.channelId, -1),
    );
    return await this.messageRepository.save(
      SaveChannelMessageDto.fromExitDto(dto),
    );
  }

  /**
   * 유저가 채널에 속해 있는지 확인하고, 속해 있다면 퇴장시키는 함수
   * 채널에 속해 있지 않은 경우 아무것도 하지 않는다
   * */
  private async exitIfUserIsInChannel(userId: number): Promise<ChannelMessage> {
    const channelUser: ChannelUser =
      await this.channelUserRepository.findByUserIdAndNotDeleted(userId);
    let message: ChannelMessage = null;
    if (channelUser) {
      message = await this.exitChannel(
        new ChannelExitDto(userId, channelUser.channel.id),
      );
      if (channelUser.channel.headCount === 1) {
        await this.channelRepository.deleteById(channelUser.channel.id);
      }
    }
    return message;
  }

  private async postGameFromInvitation(
    invitation: GameInviteModel,
  ): Promise<GameModel> {
    const { senderId, receiverId, mode } = invitation;
    try {
      const response = await axios.post(process.env.GAMESERVER_URL + '/games', {
        user1Id: senderId,
        user2Id: receiverId,
        type: GAMETYPE_NORMAL,
        mode,
      });
      const game: GameModel = new GameModel(
        response.data.gameId,
        GAMETYPE_NORMAL,
        mode,
      );
      this.userFactory.setGame(senderId, game);
      this.userFactory.setGame(receiverId, game);
      return game;
    } catch (error) {
      console.log(error.errno, error.code, error.message);
      await this.notificationGateWay.cancelGameInvite(senderId);
      throw new BadRequestException('게임 생성에 실패했습니다.');
    }
  }
}
