import { Injectable } from '@nestjs/common';
import { ProfileImageRepository } from '../profile-image/profile-image.repository';

@Injectable()
export class FriendService {
  constructor(
    // private userRepository: UserRepository,
    private profileImageRepository: ProfileImageRepository,
  ) {}
}
