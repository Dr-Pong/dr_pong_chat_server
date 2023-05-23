export const FRIENDSTATUS_FRIEND = 'friend' as const;
export const FRIENDSTATUS_REQUESTING = 'requesting' as const;
export const FRIENDSTATUS_DELETED = 'deleted' as const;

export type FriendType = 'friend' | 'requesting' | 'deleted';
