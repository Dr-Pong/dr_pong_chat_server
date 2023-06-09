import { BadRequestException, Injectable } from '@nestjs/common';
import { ChannelUserRepository } from '../repository/channel-user.repository';
import { ChannelRepository } from '../repository/channel.repository';
import { Channel } from '../entity/channel.entity';
import { ChannelFactory } from '../../factory/channel.factory';
import { ChannelModel } from '../../factory/model/channel.model';
import { UserModel } from '../../factory/model/user.model';
import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
  runOnTransactionRollback,
} from 'typeorm-transactional';
import { UserFactory } from '../../factory/user.factory';
import { ChannelUser } from '../entity/channel-user.entity';
import { PostChannelAcceptInviteDto } from '../dto/post/post.channel.accept.invite.dto';
import { Page } from 'src/global/utils/page';
import { SaveChannelDto } from '../dto/post/save.channel.dto';
import { SaveChannelUserDto } from '../dto/post/save.channel-user.dto';
import {
  checkUserInChannel,
  checkUserExist,
  checkChannelExist,
  checkUserIsInvited,
  validateChannelJoin,
  checkChannelNameIsDuplicate,
} from '../validation/errors.channel';
import { InviteModel } from '../../factory/model/invite.model';
import {
  JOIN_CHANNEL_INVITE,
  JOIN_CHANNEL_JOIN,
} from 'src/domain/channel/type/type.join.channel';
import { ChannelMessageRepository } from '../repository/channel-message.repository';
import { PostChannelMessageDto } from '../dto/post/post.channel-message.dto';
import { ChatGateWay } from 'src/gateway/chat.gateway';
import { MessageDto } from 'src/gateway/dto/message.dto';
import { SaveChannelMessageDto } from '../dto/post/save.channel-message.dto';
import {
  ChannelMessageHistoryDto,
  ChannelMessagesHistoryDto,
} from '../dto/channel-message.history.dto';
import { ChannelMessage } from '../entity/channel-message.entity';
import { FindChannelMessagePageDto } from '../dto/get/find.channel-message.page.dto';
import { GetChannelParticipantsDto } from '../dto/get/get.channel-participants.dto';
import {
  ChannelParticipantDto,
  ChannelParticipantsDto,
} from '../dto/channel-participant.dto';
import { GetChannelMyDto } from '../dto/get/get.channel.my.dto';
import { ChannelMeDto } from '../dto/channel.me.dto';
import { PostInviteDto } from '../dto/post/post.invite.dto';
import { GetChannelPageDto } from '../dto/get/get.channel.page.dto';
import { ChannelPageDtos } from '../dto/channel.page.dto';
import { FindChannelPageDto } from '../dto/get/find.channel.page.dto';
import { PostChannelDto } from '../dto/post/post.channel.dto';
import { PostChannelJoinDto } from '../dto/post/post.channel.join.dto';
import { ChannelJoinDto } from '../dto/channel.join.dto';
import { DeleteChannelUserDto } from '../dto/delete/delete.channel.user.dto';
import { ChannelExitDto } from '../dto/channel.exit.dto';
import { GetChannelMessageHistoryDto } from '../dto/get/get.channel-message.history.dto';
import { DeleteChannelInviteDto } from '../dto/delete/delete.channel.invite.dto';
import { UpdateChannelHeadCountDto } from '../dto/patch/update.channel.headcount.dto';

@Injectable()
export class ChannelNormalService {
  constructor(
    private readonly channelUserRepository: ChannelUserRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly messageRepository: ChannelMessageRepository,
    private readonly channelFactory: ChannelFactory,
    private readonly userFactory: UserFactory,
    private readonly chatGateway: ChatGateWay,
  ) {}

  /**
   * 채널의 참여자 목록을 조회하는 함수
   * 채널에 참여한 유저가 아니면 조회할 수 없다
   * ChannelFactory에서 채널을 조회하고 그 채널의 참여자 목록을 조회한다
   * Factory를 사용하기 때문에 비동기로 처리하지 않는다
   */
  getChannelParticipants(
    getDto: GetChannelParticipantsDto,
  ): ChannelParticipantsDto {
    const channel: ChannelModel = this.channelFactory.findById(
      getDto.channelId,
    );
    const users: UserModel[] = this.channelFactory.getUsers(channel.id);
    checkUserInChannel(channel, getDto.userId);

    const responseDto: ChannelParticipantsDto = new ChannelParticipantsDto();
    users.map((user) => {
      if (user.id === getDto.userId) {
        responseDto.me = ChannelParticipantDto.fromModel(user);
      } else {
        responseDto.participants.push(ChannelParticipantDto.fromModel(user));
      }
    });
    responseDto.headCount = channel.users.size;
    responseDto.maxCount = channel.maxHeadCount;
    return responseDto;
  }

  /**
   * 유저가 참여한 채널을 조회하는 함수
   * 참여한 채널이 없으면 null이 반환된다
   * Factory를 사용하기 때문에 비동기로 처리하지 않는다
   */
  getChannelMy(getDto: GetChannelMyDto): ChannelMeDto {
    const user: UserModel = this.userFactory.findById(getDto.userId);
    const channel: ChannelModel = this.channelFactory.findById(
      user.joinedChannel,
    );

    return ChannelMeDto.fromModel(channel);
  }

  /**
   * 유저를 채널에 초대하는 함수
   * 이미 초대된 유저라면 아무 일도 일어나지 않는다
   * UserModel의 inviteList에 추가해준다
   * Factory를 사용하기 때문에 비동기로 처리하지 않는다
   */
  postInvite(postDto: PostInviteDto): void {
    const channel: ChannelModel = this.channelFactory.channels.get(
      postDto.channelId,
    );
    checkChannelExist(channel);

    const host: UserModel = this.userFactory.findById(postDto.userId);
    const target: UserModel = this.userFactory.findById(postDto.targetId);
    checkUserExist(host);
    checkUserExist(target);

    const invite: InviteModel = new InviteModel(
      channel.id,
      channel.name,
      host.nickname,
    );

    this.userFactory.invite(target.id, invite);
  }

  /**
   * 채널에 메시지를 전송하는 함수
   * 채널에 참여한 유저가 아니면 메시지를 전송할 수 없다
   * 채널에 참여한 유저가 뮤트 상태라면 메시지를 전송할 수 없다
   * 채널에 메시지를 전송하면 채널의 참여자들에게 메시지를 전송한다
   * 차단된 유저들에게는 메시지를 전송하지 않는다
   * 전송한 메시지를 DB에 저장한다
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannelMessage(postDto: PostChannelMessageDto): Promise<void> {
    const channel: ChannelModel = this.channelFactory.findById(
      postDto.channelId,
    );
    const user: UserModel = this.userFactory.findById(postDto.userId);
    checkChannelExist(channel);
    checkUserInChannel(channel, user.id);
    if (user.isMuted) return;

    const message: MessageDto = MessageDto.fromPostDto(postDto);
    this.chatGateway.sendMessageToChannel(
      postDto.userId,
      postDto.channelId,
      message,
    );

    await this.messageRepository.save(
      SaveChannelMessageDto.fromMessageDto(message),
    );

    runOnTransactionRollback(() => {
      //에러 메시지 전송
    });
  }

  /**
   * 채널 목록을 조회하는 함수
   * 생성 순, 참여자 순으로 정렬할 수 있다
   * keyword가 주어지면 채널 이름에 keyword가 포함된 채널을 조회한다
   * keyword가 주어지지 않으면 모든 채널을 조회한다
   * 채널이 없으면 빈 배열이 반환된다
   */
  async getChannelPages(getDto: GetChannelPageDto): Promise<ChannelPageDtos> {
    let channels: Page<Channel[]>;
    if (getDto.orderBy === 'popular') {
      channels = await this.channelRepository.findPageByKeywordOrderByHeadCount(
        FindChannelPageDto.fromGetDto(getDto),
      );
    } else {
      channels = await this.channelRepository.findPageByKeywordOrderByCreateAt(
        FindChannelPageDto.fromGetDto(getDto),
      );
    }

    const responseDto: ChannelPageDtos = ChannelPageDtos.fromPage(channels);

    return responseDto;
  }

  /**
   * 채널을 새로 생성하는 함수
   * 채널 이름의 중복은 불가능
   * 생성에 성공할 시 기존에 참여한 채널에서는 자동 퇴장처리된다
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannel(postDto: PostChannelDto): Promise<void> {
    await checkChannelNameIsDuplicate(this.channelRepository, postDto.title);

    this.exitIfUserIsInChannel(postDto.userId);

    const newChannel: Channel = await this.channelRepository.save(
      SaveChannelDto.from(postDto),
    );
    await this.channelUserRepository.save(
      new SaveChannelUserDto(postDto.userId, newChannel.id),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(postDto.userId);
      if (userModel.joinedChannel) {
        this.channelFactory.leave(userModel.id, userModel.joinedChannel);
      }
      this.channelFactory.create(
        userModel.id,
        ChannelModel.fromEntity(newChannel),
      );
    });
  }

  /**
   * 유저를 채널에 입장시켜주는 함수
   * 입장 성공 시 기존에 있던 채널에서는 자동 퇴장처리된다
   */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannelJoin(postDto: PostChannelJoinDto): Promise<void> {
    this.exitIfUserIsInChannel(postDto.userId);

    await this.joinChannel(
      new ChannelJoinDto(
        postDto.userId,
        postDto.channelId,
        postDto.password,
        JOIN_CHANNEL_JOIN,
      ),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(postDto.userId);
      if (userModel.joinedChannel) {
        this.channelFactory.leave(userModel.id, userModel.joinedChannel);
      }
      this.channelFactory.join(userModel.id, postDto.channelId);
    });
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
    checkUserIsInvited(user, postDto.channelId);

    this.exitIfUserIsInChannel(postDto.userId);

    await this.joinChannel(
      new ChannelJoinDto(
        postDto.userId,
        postDto.channelId,
        null,
        JOIN_CHANNEL_INVITE,
      ),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(postDto.userId);
      if (userModel.joinedChannel) {
        this.channelFactory.leave(userModel.id, userModel.joinedChannel);
      }
      this.channelFactory.join(userModel.id, postDto.channelId);
      this.userFactory.deleteInvite(userModel.id, postDto.channelId);
    });
  }

  /**
   * 유저가 채널에서 나가는 함수
   * 관리자가 퇴장할 경우 관리자 권한이 없어진다
   * mute 상태인 유저가 퇴장할 경우 mute 상태가 유지된다 (mute 상태는 관리자가 풀어줘야 한다)
   * */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteChannelUser(deleteDto: DeleteChannelUserDto): Promise<void> {
    const channelUser: ChannelUser =
      await this.channelUserRepository.findByUserIdAndChannelIdAndIsDelFalse(
        deleteDto.userId,
        deleteDto.channelId,
      );
    if (!channelUser) {
      throw new BadRequestException('User is not joined channel');
    }

    await this.exitChannel(
      new ChannelExitDto(deleteDto.userId, channelUser.channel.id),
    );
    if (channelUser.channel.headCount === 1) {
      await this.channelRepository.deleteById(channelUser.channel.id);
    }

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      const userModel: UserModel = this.userFactory.findById(deleteDto.userId);
      this.channelFactory.leave(userModel.id, deleteDto.channelId);
    });
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getChannelMessageHistory(
    getDto: GetChannelMessageHistoryDto,
  ): Promise<ChannelMessagesHistoryDto> {
    const channel: ChannelModel = this.channelFactory.findById(
      getDto.channelId,
    );

    checkChannelExist(channel);
    checkUserInChannel(channel, getDto.userId);

    const messages: ChannelMessage[] =
      await this.messageRepository.findAllByChannelId(
        FindChannelMessagePageDto.from(getDto),
      );
    let isLastPage = true;
    if (messages.length > getDto.count) {
      isLastPage = false;
      messages.pop();
    }

    const responseDto: ChannelMessagesHistoryDto = {
      chats: messages.map((message) => {
        return ChannelMessageHistoryDto.fromEntity(getDto.userId, message);
      }),
      isLastPage,
    };
    return responseDto;
  }

  /**
   * 채널 초대를 거절하는 함수
   * userModel의 invite에서 해당 채널을 삭제한다
   * */
  async deleteChannelInvite(deleteDto: DeleteChannelInviteDto): Promise<void> {
    const user: UserModel = this.userFactory.findById(deleteDto.userId);
    this.userFactory.deleteInvite(user.id, deleteDto.channelId);
  }

  /**
   * 채널입장 처리하는 함수
   * 에러 처리, DB save, update 처리용 함수
   * 에러 케이스 - 채널이 없는 경우, 비밀번호가 틀린 경우, 인원이 꽉 찬 경우, 채널에서 BAN된 경우
   * channelUser - 유저가 채널에 입장한 것을 저장한다
   * channel - 채널의 인원수를 업데이트한다
   * message - 채널 입장 메시지를 저장한다
   * */
  private async joinChannel(dto: ChannelJoinDto): Promise<void> {
    await validateChannelJoin(dto, this.channelRepository, this.channelFactory);

    await this.channelUserRepository.save(
      new SaveChannelUserDto(dto.userId, dto.channelId),
    );
    await this.channelRepository.updateHeadCount(
      new UpdateChannelHeadCountDto(dto.channelId, 1),
    );
    await this.messageRepository.save(SaveChannelMessageDto.fromJoinDto(dto));
  }

  /**
   * 채널퇴장 처리하는 함수
   * DB delete, update 처리용 함수
   * channelUser - 유저가 채널에 퇴장한 것을 저장한다
   * channel - 채널의 인원수를 업데이트한다
   * message - 채널 퇴장 메시지를 저장한다
   * */
  private async exitChannel(dto: ChannelExitDto): Promise<void> {
    await this.channelUserRepository.deleteByUserIdAndChannelId(
      dto.userId,
      dto.channelId,
    );
    await this.channelRepository.updateHeadCount(
      new UpdateChannelHeadCountDto(dto.channelId, -1),
    );
    await this.messageRepository.save(SaveChannelMessageDto.fromExitDto(dto));
  }

  /**
   * 유저가 채널에 속해 있는지 확인하고, 속해 있다면 퇴장시키는 함수
   * 채널에 속해 있지 않은 경우 아무것도 하지 않는다
   * */
  private async exitIfUserIsInChannel(userId: number): Promise<void> {
    const channelUser: ChannelUser =
      await this.channelUserRepository.findByUserIdAndNotDeleted(userId);
    if (channelUser) {
      await this.exitChannel(
        new ChannelExitDto(userId, channelUser.channel.id),
      );
    }
  }
}
