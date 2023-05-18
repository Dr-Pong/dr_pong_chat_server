import { Injectable } from '@nestjs/common';
import { UserModel } from './user.model';
import { ChannelModel } from '../channel/channel.model';
import { Socket } from 'socket.io';
import { UserStatusType } from 'src/global/type/type.user.status';

@Injectable()
export class UserFactory {
  users: Map<string, UserModel> = new Map();

  joinChannel(user: UserModel, channel: ChannelModel) {
    user.joinedChannel = channel.name;
  }

  leaveChannel(user: UserModel) {
    user.joinedChannel = null;
  }

  block(user: UserModel, target: UserModel): boolean {
    if (!user.blockedList.includes(target.id)) {
      user.blockedList.push(target.id);
      return true;
    }
    return false;
  }

  unblock(user: UserModel, target: UserModel): boolean {
    if (
      user.blockedList.find((id) => {
        id === target.id;
      })
    ) {
      user.blockedList = user.blockedList.filter((id) => {
        id !== target.id;
      });
      return true;
    }
    return false;
  }

  setSocket(user: UserModel, socket: Socket) {
    user.socket = socket;
  }

  updateProfile(user: UserModel, profileImage: string) {
    user.profileImage = profileImage;
  }

  setStatus(user: UserModel, status: UserStatusType) {
    user.status = status;
  }
}
