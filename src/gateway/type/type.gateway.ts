export const GATEWAY_NOTIFICATION = 'notification' as const;
export const GATEWAY_CHANNEL = 'channel' as const;
export const GATEWAY_FRIEND = 'friends' as const;
export const GATEWAY_DIRECTMESSAGE = 'dm' as const;

export type GateWayType = 'notification' | 'channel' | 'friends' | 'dm';
