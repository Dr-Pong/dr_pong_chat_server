export const USERSTATUS_ONLINE = 'online' as const;
export const USERSTATUS_OFFLINE = 'offline' as const;
export const USERSTATUS_INGAME = 'inGame' as const;

export type UserStatusType = 'online' | 'offline' | 'inGame';
