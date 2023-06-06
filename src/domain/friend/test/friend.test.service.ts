import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { Friend } from '../friend.entity';
import { Block } from 'src/domain/block/block.entity';
import {
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class FriendTestService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}
  users: User[] = [];
  profileImages: ProfileImage[] = [];
  friends: Friend[] = [];
  blocks: Block[] = [];

  clear() {
    this.users.splice(0);
    this.profileImages.splice(0);
    this.friends.splice(0);
    this.blocks.splice(0);
  }

  async createProfileImages(): Promise<void> {
    for (let i = 0; i < 2; i++) {
      const profileImage = await this.profileImageRepository.save({
        url: 'profileImage' + i.toString(),
      });
      this.profileImages.push(profileImage);
    }
  }

  async createBasicUsers(person: number): Promise<void> {
    const index: number = person;
    for (let i = 0; i < index; i++) {
      const user = await this.userRepository.save({
        nickname: 'user' + i.toString(),
        image: this.profileImages[i % 2 == 0 ? 0 : 1],
      });
      this.users.push(user);
    }
  }

  async createBasicUser() {
    const index: number = this.users.length;
    const user = await this.userRepository.save({
      nickname: 'user' + index.toString(),
      image: this.profileImages[0],
    });
    this.users.push(user);
  }

  async createUserRequesting(person: number): Promise<void> {
    const index: number = person;
    for (let i = 1; i < index; i++) {
      const roomId = FriendChatManager.generateRoomId(
        this.users[0].id.toString(),
        this.users[i].id.toString(),
      );
      const friend = await this.friendRepository.save({
        sender: this.users[0],
        receiver: this.users[i],
        status: FRIENDSTATUS_REQUESTING,
        roomId: roomId,
      });
      this.friends.push(friend);
    }
  }

  async createUser0ToRequesting(person: number): Promise<void> {
    const index: number = person;
    const roomId = FriendChatManager.generateRoomId(
      this.users[index].id.toString(),
      this.users[0].id.toString(),
    );
    const friend = await this.friendRepository.save({
      sender: this.users[index],
      receiver: this.users[0],
      status: FRIENDSTATUS_REQUESTING,
      roomId: roomId,
    });
    this.friends.push(friend);
  }

  async createUserFriends(person: number): Promise<void> {
    const index: number = person;
    for (let i = 1; i < index; i++) {
      const roomId = FriendChatManager.generateRoomId(
        this.users[0].id.toString(),
        this.users[i].id.toString(),
      );
      const friend = await this.friendRepository.save({
        sender: this.users[0],
        receiver: this.users[i],
        status: FRIENDSTATUS_FRIEND,
        roomId: roomId,
      });
      this.friends.push(friend);
    }
  }

  async createUser0ToFriends(person: number): Promise<void> {
    const index: number = person;
    const roomId = FriendChatManager.generateRoomId(
      this.users[index].id.toString(),
      this.users[0].id.toString(),
    );
    const friend = await this.friendRepository.save({
      sender: this.users[index],
      receiver: this.users[0],
      status: FRIENDSTATUS_FRIEND,
      roomId: roomId,
    });
    this.friends.push(friend);
  }

  async createReverseUserFriends(): Promise<void> {
    for (let i = 9; i > 0; i--) {
      const roomId = FriendChatManager.generateRoomId(
        this.users[0].id.toString(),
        this.users[i].id.toString(),
      );
      const friend = await this.friendRepository.save({
        sender: this.users[0],
        receiver: this.users[i],
        status: FRIENDSTATUS_FRIEND,
        roomId: roomId,
      });
      this.friends.push(friend);
    }
  }

  async createUserBlocks(): Promise<void> {
    const index: number = this.blocks.length;
    for (let i = 1; i < index; i++) {
      const block = await this.blockRepository.save({
        user: this.users[0],
        block: this.users[i],
      });
      this.blocks.push(block);
    }
  }

  async giveTokenToUser(user: User) {
    const token = this.jwtService.sign({
      id: user.id,
      nickname: user.nickname,
    });
    return token;
  }
}
