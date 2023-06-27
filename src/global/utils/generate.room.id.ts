export class FriendChatManager {
  static generateRoomId(userId1: number, userId2: number): string {
    const sortedNicknames = [userId1?.toString(), userId2?.toString()].sort(
      (a, b) => a.localeCompare(b),
    );
    return sortedNicknames.join('+');
  }
}
