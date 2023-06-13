export const RELATION_FRIEND = 'friend' as const;
export const RELATION_BLOCKED = 'blocked' as const;
export const RELATION_NONE = 'none' as const;

export type UserRelationType = 'friend' | 'blocked' | 'none';
