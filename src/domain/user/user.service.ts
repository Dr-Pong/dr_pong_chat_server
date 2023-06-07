import { IsolationLevel, Transactional } from 'typeorm-transactional';
import { GetIdFromNicknameDto } from './dto/get.id.from.nickname.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserIdDto } from './dto/user.id.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  @Transactional({ isolationLevel: IsolationLevel.REPEATABLE_READ })
  async getIdFromNickname(getDto: GetIdFromNicknameDto): Promise<UserIdDto> {
    const { nickname } = getDto;
    const user = await this.userRepository.findByNickname(nickname);
    if (!user) throw new BadRequestException('No such User');
    return { id: user.id };
  }
}
