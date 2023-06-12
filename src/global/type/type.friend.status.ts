export const FRIENDSTATUS_FRIEND = 'friend' as const;
export const FRIENDSTATUS_PENDING = 'pending' as const;
export const FRIENDSTATUS_DELETED = 'deleted' as const;

export type FriendType = 'friend' | 'pending' | 'deleted';
