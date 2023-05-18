import { Socket } from 'socket.io';
import { UserStatusType } from 'src/global/type/type.user.status';

export class UserModel {
  id: number;
  nickname: string;
  joinedChannel: string | null;
  blockedList: number[];
  socket: Socket;
  profileImage: string;
  status: UserStatusType;
}
