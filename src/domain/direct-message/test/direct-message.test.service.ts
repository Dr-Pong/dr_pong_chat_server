import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileImage } from 'src/domain/profile-image/profile-image.entity';
import { User } from 'src/domain/user/user.entity';
import { Repository } from 'typeorm';
import { Block } from 'src/domain/block/block.entity';
import {
  FRIENDSTATUS_FRIEND,
  FRIENDSTATUS_REQUESTING,
} from 'src/global/type/type.friend.status';
import { FriendChatManager } from 'src/global/utils/generate.room.id';
import { Friend } from 'src/domain/friend/friend.entity';
import { DirectMessage } from '../direct-message.entity';
import { DirectMessageRoom } from 'src/domain/direct-message-room/direct-message-room.entity';

@Injectable()
export class DirectMessageTestService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProfileImage)
    private profileImageRepository: Repository<ProfileImage>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
    @InjectRepository(DirectMessage)
    private directMessageRepository: Repository<DirectMessage>,
    @InjectRepository(DirectMessageRoom)
    private friendDirectMessageRepository: Repository<DirectMessageRoom>,
  ) {}
  users: User[] = [];
  profileImages: ProfileImage[] = [];
  friends: Friend[] = [];
  blocks: Block[] = [];
  directMessage: DirectMessage[] = [];
  friendDirectMessage: DirectMessageRoom[] = [];

  clear() {
    this.users.splice(0);
    this.profileImages.splice(0);
    this.friends.splice(0);
    this.blocks.splice(0);
    this.directMessage.splice(0);
    this.friendDirectMessage.splice(0);
  }

  async createProfileImages(): Promise<void> {
    const index: number = this.users.length;
    for (let i = 0; i < index; i++) {
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
        image: this.profileImages[i],
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

  async createUserRequesting(): Promise<Friend[]> {
    const index: number = this.users.length;
    for (let i = 1; i < index; i++) {
      const friend = await this.friendRepository.save({
        user: this.users[0],
        friend: this.users[i],
        status: FRIENDSTATUS_REQUESTING,
      });
      this.friends.push(friend);
      return this.friends;
    }
  }

  async createAnotherUsersRequesting(): Promise<Friend[]> {
    const index: number = this.users.length;
    for (let i = 1; i < index; i++) {
      const friend = await this.friendRepository.save({
        user: this.users[i],
        friend: this.users[0],
        status: FRIENDSTATUS_REQUESTING,
      });
      this.friends.push(friend);
      return this.friends;
    }
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

  //* dm 유저에게 10개씩 생성/
  async createDirectMessageToUser1(messageCount: number): Promise<void> {
    for (let i = 0; i < messageCount; i++) {
      const directMessage = await this.directMessageRepository.save({
        sender: this.users[0],
        roomId: FriendChatManager.generateRoomId(
          this.users[0].id.toString(),
          this.users[1].id.toString(),
        ),
        message: 'message' + i.toString(),
        time: new Date().toISOString(),
      });
      this.directMessage.push(directMessage);
    }
  }

  //FriendDirectMessage만들기 list
  async createFriendDirectMessage(): Promise<void> {
    const index: number = this.users.length;
    const friendDirectMessages: DirectMessageRoom[] = [];

    for (let i = 0; i < index; i++) {
      const lastMessage = await this.directMessageRepository.findOne({
        where: { id: this.directMessage[i].id },
        order: { time: 'DESC' },
      });

      const friendDirectMessage = await this.friendDirectMessageRepository.save(
        {
          userId: this.users[0],
          friendId: this.users[i],
          roomId: FriendChatManager.generateRoomId(
            this.users[0].id.toString(),
            this.users[i].id.toString(),
          ),
          last_message_id: lastMessage ? lastMessage.id : null,
          is_chat_on: true,
        },
      );

      friendDirectMessages.push(friendDirectMessage);
    }
  }
}
