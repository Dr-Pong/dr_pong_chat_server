import {
  IsolationLevel,
  Transactional,
  runOnTransactionComplete,
} from 'typeorm-transactional';
import { GetIdFromNicknameDto } from './dto/get.id.from.nickname.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserIdDto } from './dto/user.id.dto';
import { UserRepository } from './user.repository';
import { PostGatewayUserDto } from './dto/post.gateway.users.dto';
import { UserFactory } from '../factory/user.factory';
import { UserModel } from '../factory/model/user.model';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private readonly userFactory: UserFactory,
  ) {}

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getIdFromNickname(getDto: GetIdFromNicknameDto): Promise<UserIdDto> {
    const { nickname } = getDto;
    const user = await this.userRepository.findByNickname(nickname);
    if (!user) throw new BadRequestException('No such User');
    return { id: user.id };
  }

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async postGatewayUser(postDto: PostGatewayUserDto): Promise<void> {
    const user: User = await this.userRepository.save(postDto);
    runOnTransactionComplete(async () => {
      await this.userFactory.create(UserModel.fromEntity(user));
    });
  }
}
