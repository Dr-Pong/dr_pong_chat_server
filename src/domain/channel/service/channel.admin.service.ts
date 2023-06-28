import { Injectable } from '@nestjs/common';
import { ChannelUserRepository } from '../repository/channel-user.repository';
import { ChannelRepository } from '../repository/channel.repository';
import { UserFactory } from '../../factory/user.factory';
import { ChannelFactory } from '../../factory/channel.factory';
import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
} from 'typeorm-transactional';
import { ChannelModel } from '../../factory/model/channel.model';
import {
  checkChannelExist,
  checkExcutable,
  checkUserHaveAuthority,
  checkUserInChannel,
  checkUserIsOwner,
  isUserAdmin,
} from '../validation/validation.channel';
import { UserModel } from '../../factory/model/user.model';
import { SaveChannelMessageDto } from '../dto/post/save.channel-message.dto';
import { ChannelMessageRepository } from '../repository/channel-message.repository';
import { PostChannelAdminDto } from '../dto/post/post.channel.admin.dto';
import { DeleteChannelKickDto } from '../dto/delete/delete.channel.kick.dto';
import { ChannelAdminCommandDto } from '../dto/channel.admin.command.dto';
import { ChannelExitDto } from '../dto/channel.exit.dto';
import { PostChannelBanDto } from '../dto/post/post.channel.ban.dto';
import { PostChannelMuteDto } from '../dto/post/post.channel.mute.dto';
import { DeleteChannelMuteDto } from '../dto/delete/delete.channel.mute.dto';
import { PatchChannelDto } from '../dto/patch/patch.channel.dto';
import { DeleteChannelDto } from '../dto/delete/delete.channel.dto';
import { UpdateChannelDto } from '../dto/patch/update.channel.dto';
import { UpdateChannelHeadCountDto } from '../dto/patch/update.channel.headcount.dto';
import { DeleteChannelAdminDto } from '../dto/delete/delete.channel.admin.dto';
import {
  CHANNEL_PARTICIPANT_ADMIN,
  CHANNEL_PARTICIPANT_NORMAL,
} from '../type/type.channel-participant';
import { ChannelGateWay } from 'src/gateway/channel.gateway';
import {
  CHAT_BAN,
  CHAT_KICK,
  CHAT_MUTE,
  CHAT_SETADMIN,
  CHAT_UNMUTE,
  CHAT_UNSETADMIN,
} from '../type/type.channel.action';

@Injectable()
export class ChannelAdminService {
  constructor(
    private readonly channelFactory: ChannelFactory,
    private readonly userFactory: UserFactory,
    private readonly channelRepository: ChannelRepository,
    private readonly channelUserRepository: ChannelUserRepository,
    private readonly messageRepository: ChannelMessageRepository,
    private readonly chatGateway: ChannelGateWay,
  ) {}

  /**
   * 유저를 관리자로 임명하는 함수
   * 채널의 소유자만 가능하다
   * 채널에 속한 유저만 관리자로 임명 가능하다
   * 이미 관리자인 경우 아무런 동작을 하지 않는다
   * */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannelAdmin(postDto: PostChannelAdminDto): Promise<void> {
    const channel: ChannelModel = this.channelFactory.findById(
      postDto.channelId,
    );
    checkChannelExist(channel);

    checkUserInChannel(channel, postDto.requestUserId);
    checkUserInChannel(channel, postDto.targetUserId);

    checkUserIsOwner(channel, postDto.requestUserId);
    if (isUserAdmin(channel, postDto.targetUserId)) {
      return;
    }

    await this.channelUserRepository.updateRoleType(
      postDto.targetUserId,
      channel.id,
      CHANNEL_PARTICIPANT_ADMIN,
    );

    await this.messageRepository.save(
      SaveChannelMessageDto.fromCommandDto(postDto),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelFactory.setAdmin(postDto.targetUserId, postDto.channelId);
      this.chatGateway.sendNoticeToChannel(
        postDto.targetUserId,
        postDto.channelId,
        CHAT_SETADMIN,
      );
    });
  }

  /**
   * 유저를 관리자에서 해제하는 함수
   * 채널의 소유자만 가능하다
   * 채널에 있는 유저만 관리자에서 해제 가능하다
   * 이미 관리자가 아닌 경우 아무런 동작을 하지 않는다
   * */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteChannelAdmin(deleteDto: DeleteChannelAdminDto): Promise<void> {
    const channel: ChannelModel = this.channelFactory.findById(
      deleteDto.channelId,
    );
    checkChannelExist(channel);

    checkUserInChannel(channel, deleteDto.requestUserId);
    checkUserInChannel(channel, deleteDto.targetUserId);

    checkUserIsOwner(channel, deleteDto.requestUserId);
    if (!isUserAdmin(channel, deleteDto.targetUserId)) {
      return;
    }

    await this.channelUserRepository.updateRoleType(
      deleteDto.targetUserId,
      channel.id,
      CHANNEL_PARTICIPANT_NORMAL,
    );

    await this.messageRepository.save(
      SaveChannelMessageDto.fromCommandDto(deleteDto),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelFactory.unsetAdmin(
        deleteDto.targetUserId,
        deleteDto.channelId,
      );
      this.chatGateway.sendNoticeToChannel(
        deleteDto.targetUserId,
        deleteDto.channelId,
        CHAT_UNSETADMIN,
      );
    });
  }

  /**
   * 유저를 채널에서 추방하는 함수
   * 채널의 소유자 또는 관리자만 가능하다
   * 채널에 속해 있지 않은 유저를 추방하려하면 아무런 동작을 하지 않는다
   * 채널의 소유자나 관리자끼리는 추방할 수 없다
   * 추방된 유저는 채널에 다시 들어올 수 있다
   * */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteChannelKick(deleteDto: DeleteChannelKickDto): Promise<void> {
    const dto: ChannelAdminCommandDto = deleteDto;
    const channel: ChannelModel = this.channelFactory.findById(
      deleteDto.channelId,
    );
    checkChannelExist(channel);
    checkExcutable(dto, this.channelFactory, this.userFactory);

    if (!channel.users.has(deleteDto.targetUserId)) {
      return;
    }

    await this.removeUser(new ChannelExitDto(dto.targetUserId, channel.id));

    await this.messageRepository.save(
      SaveChannelMessageDto.fromCommandDto(deleteDto),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelFactory.leave(deleteDto.targetUserId, deleteDto.channelId);
      this.chatGateway.sendNoticeToChannel(
        deleteDto.targetUserId,
        deleteDto.channelId,
        CHAT_KICK,
      );
    });
  }

  /**
   * 유저를 채널에서 Ban하는 함수
   * 채널의 소유자 또는 관리자만 가능하다
   * 채널에 속해 있지 않은 유저를 Ban해도 Ban 목록에 추가된다
   * 채널의 관리자끼리는 Ban할 수 없다
   * 채널의 소유자는 관리자를 Ban할 수 있다
   * Ban된 유저는 채널에 다시 들어올 수 없다
   * */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannelBan(postDto: PostChannelBanDto): Promise<void> {
    const dto: ChannelAdminCommandDto = postDto;
    const channel: ChannelModel = this.channelFactory.findById(
      postDto.channelId,
    );

    checkChannelExist(channel);
    checkExcutable(dto, this.channelFactory, this.userFactory);

    if (channel.banList.has(postDto.targetUserId)) {
      return;
    }

    await this.channelUserRepository.updateIsBanned(
      postDto.targetUserId,
      channel.id,
      true,
    );

    await this.removeUser(new ChannelExitDto(postDto.targetUserId, channel.id));

    await this.messageRepository.save(
      SaveChannelMessageDto.fromCommandDto(postDto),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelFactory.setBan(postDto.targetUserId, postDto.channelId);
      this.channelFactory.leave(postDto.targetUserId, postDto.channelId);
      this.chatGateway.sendNoticeToChannel(
        postDto.targetUserId,
        postDto.channelId,
        CHAT_BAN,
      );
    });
  }

  /**
   * 유저를 채널에서 mute하는 함수
   * 채널의 소유자 또는 관리자만 가능하다
   * 채널에 속해 있지 않은 유저를 mute해도 정상 동작한다
   * 채널의 관리자끼리는 mute할 수 없다
   * */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postChannelMute(postDto: PostChannelMuteDto): Promise<void> {
    const dto: ChannelAdminCommandDto = postDto;
    const channel: ChannelModel = this.channelFactory.findById(
      postDto.channelId,
    );

    checkChannelExist(channel);
    checkExcutable(dto, this.channelFactory, this.userFactory);

    if (channel.muteList.has(postDto.targetUserId)) {
      return;
    }

    await this.channelUserRepository.updateIsMuted(
      postDto.targetUserId,
      channel.id,
      true,
    );

    await this.messageRepository.save(
      SaveChannelMessageDto.fromCommandDto(postDto),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelFactory.setMute(postDto.targetUserId, postDto.channelId);
      this.chatGateway.sendNoticeToChannel(
        postDto.targetUserId,
        postDto.channelId,
        CHAT_MUTE,
      );
    });
  }

  /**
   * 유저를 채널에서 Unmute하는 함수
   * 채널의 소유자 또는 관리자만 가능하다
   * 채널에 속해 있지 않은 유저를 Unmute해도 정상 동작한다
   * 채널의 관리자끼리는 Unmute할 수 없다
   * */
  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteChannelMute(deleteDto: DeleteChannelMuteDto): Promise<void> {
    const dto: ChannelAdminCommandDto = deleteDto;
    const channel: ChannelModel = this.channelFactory.findById(
      deleteDto.channelId,
    );

    checkChannelExist(channel);
    checkExcutable(dto, this.channelFactory, this.userFactory);

    if (!channel.muteList.has(deleteDto.targetUserId)) {
      return;
    }

    await this.channelUserRepository.updateIsMuted(
      deleteDto.targetUserId,
      channel.id,
      false,
    );

    await this.messageRepository.save(
      SaveChannelMessageDto.fromCommandDto(deleteDto),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelFactory.unsetMute(
        deleteDto.targetUserId,
        deleteDto.channelId,
      );
      this.chatGateway.sendNoticeToChannel(
        deleteDto.targetUserId,
        deleteDto.channelId,
        CHAT_UNMUTE,
      );
    });
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async patchChannel(patchDto: PatchChannelDto): Promise<void> {
    const channel: ChannelModel = this.channelFactory.findById(
      patchDto.channelId,
    );
    const user: UserModel = this.userFactory.findById(patchDto.userId);

    checkChannelExist(channel);
    checkUserHaveAuthority(user);

    await this.channelRepository.updateAccessAndPassword(
      UpdateChannelDto.fromPatchDto(patchDto),
    );

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelFactory.updateType(patchDto.access, patchDto.channelId);
      this.channelFactory.updatePassword(patchDto.password, patchDto.channelId);
    });
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async deleteChannel(deleteDto: DeleteChannelDto): Promise<void> {
    const channel: ChannelModel = this.channelFactory.findById(
      deleteDto.channelId,
    );

    checkChannelExist(channel);
    checkUserIsOwner(channel, deleteDto.userId);

    await this.channelUserRepository.deleteByChannelId(channel.id);
    await this.channelRepository.deleteById(channel.id);

    /** 트랜잭션이 성공하면 Factory에도 결과를 반영한다 */
    runOnTransactionComplete(() => {
      this.channelFactory.delete(deleteDto.channelId);
    });
  }

  /**
   * 채널퇴장 처리하는 함수
   * DB delete, update 처리용 함수
   * channelUser - 유저가 채널에 퇴장한 것을 저장한다
   * channel - 채널의 인원수를 업데이트한다
   * message - 채널 퇴장 메시지를 저장한다
   * */
  private async removeUser(dto: ChannelExitDto): Promise<void> {
    await this.channelUserRepository.deleteByUserIdAndChannelId(
      dto.userId,
      dto.channelId,
    );
    await this.channelRepository.updateHeadCount(
      new UpdateChannelHeadCountDto(dto.channelId, -1),
    );
  }
}
