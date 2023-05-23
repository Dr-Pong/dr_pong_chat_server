export class FriendChatManager {
  static generateRoomId(nickname1: string, nickname2: string): string {
    const sortedNicknames = [nickname1, nickname2].sort((a, b) =>
      a.localeCompare(b),
    );
    return sortedNicknames.join('+');
  }
}
