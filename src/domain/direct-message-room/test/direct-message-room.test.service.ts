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
import { DirectMessageRoom } from 'src/domain/direct-message-room/direct-message-room.entity';
import { DirectMessage } from 'src/domain/direct-message/direct-message.entity';

@Injectable()
export class FriendDirectMessageTestService {
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
    private directMessageRoomRepository: Repository<DirectMessageRoom>,
  ) {}
  users: User[] = [];
  profileImages: ProfileImage[] = [];
  friends: Friend[] = [];
  blocks: Block[] = [];
  directMessage: DirectMessage[] = [];
  directMessageRooom: DirectMessageRoom[] = [];

  clear() {
    this.users.splice(0);
    this.profileImages.splice(0);
    this.friends.splice(0);
    this.blocks.splice(0);
    this.directMessage.splice(0);
    this.directMessageRooom.splice(0);
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
        id: i,
        nickname: 'user' + i.toString(),
        image: this.profileImages[i],
      });
      this.users.push(user);
    }
  }

  async createBasicUser() {
    const index: number = this.users.length;
    const user = await this.userRepository.save({
      id: index,
      nickname: 'user' + index.toString(),
      image: this.profileImages[0],
    });
    this.users.push(user);
  }

  async createUserRequesting(): Promise<Friend[]> {
    const index: number = this.users.length;
    for (let i = 1; i < index; i++) {
      const friend = await this.friendRepository.save({
        id: index + i,
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
        id: index + i,
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
      const friend1 = await this.friendRepository.save({
        roomId: roomId,
        user: this.users[0],
        friend: this.users[i],
        status: FRIENDSTATUS_FRIEND,
        chatOn: false,
      });
      this.friends.push(friend1);
      const friend2 = await this.friendRepository.save({
        roomId: roomId,
        user: this.users[i],
        friend: this.users[0],
        status: FRIENDSTATUS_FRIEND,
        chatOn: false,
      });
      this.friends.push(friend2);
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

  //* dm n명의 유저에게 메시지 하나 전송*/
  async createDirectMessage(person: number): Promise<void> {
    const index: number = person;
    for (let i = 0; i < index; i++) {
      const directMessage = await this.directMessageRepository.save({
        userId: this.users[0],
        friendId: this.users[i],
        roomId: FriendChatManager.generateRoomId(
          this.users[0].id.toString(),
          this.users[i].id.toString(),
        ),
        content: 'directMessage' + i.toString(),
        time: new Date(),
      });
      this.directMessage.push(directMessage);
    }
  }

  //*FriendDirectMessage만들기 list*/
  async createDirectMessageRooms(): Promise<void> {
    const index: number = this.users.length;
    const friendDirectMessages: DirectMessageRoom[] = [];

    for (let i = 0; i < index; i++) {
      const lastMessage = await this.directMessageRepository.findOne({
        where: { id: this.directMessage[i].id },
        order: { time: 'DESC' },
      });

      const friendDirectMessage = await this.directMessageRoomRepository.save({
        userId: this.users[0],
        friendId: this.users[i],
        roomId: FriendChatManager.generateRoomId(
          this.users[0].id.toString(),
          this.users[i].id.toString(),
        ),
        lastReadMessageId: lastMessage ? lastMessage.id : null,
        isDisplay: true,
      });

      friendDirectMessages.push(friendDirectMessage);
    }
  }

  async createHalfReadDirectMessageRooms(): Promise<void> {
    const index: number = this.users.length;
    const friendDirectMessages: DirectMessageRoom[] = [];

    for (let i = 0; i < index; i++) {
      const lastMessage = await this.directMessageRepository.findOne({
        where: { id: this.directMessage[i].id },
        order: { time: 'DESC' },
      });

      const friendDirectMessage = await this.directMessageRoomRepository.save({
        userId: this.users[0],
        friendId: this.users[i],
        roomId: FriendChatManager.generateRoomId(
          this.users[0].id.toString(),
          this.users[i].id.toString(),
        ),
        lastReadMessageId: lastMessage ? lastMessage.id : null,
        isDisplay: i % 2 == 0 ? true : false,
      });

      friendDirectMessages.push(friendDirectMessage);
    }
  }
}
