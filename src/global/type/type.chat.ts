export const CHAT_MESSAGE = 'message' as const;
export const CHAT_JOIN = 'join' as const;
export const CHAT_LEAVE = 'leave' as const;
export const CHAT_KICK = 'kick' as const;
export const CHAT_BAN = 'ban' as const;
export const CHAT_MUTE = 'mute' as const;
export const CHAT_UNMUTE = 'unmute' as const;
export const CHAT_UNSETADMIN = 'unsetadmin' as const;
export const CHAT_SETADMIN = 'setadmin' as const;

export type ChatType =
  | 'message'
  | 'join'
  | 'leave'
  | 'kick'
  | 'ban'
  | 'mute'
  | 'unmute'
  | 'unsetadmin'
  | 'setadmin';
