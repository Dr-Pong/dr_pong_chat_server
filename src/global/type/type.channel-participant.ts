export const CHANNEL_PARTICIPANT_OWNER = 'owner' as const;
export const CHANNEL_PARTICIPANT_ADMIN = 'admin' as const;
export const CHANNEL_PARTICIPANT_NORMAL = 'normal' as const;

export type ChannelParticipantType = 'owner' | 'admin' | 'normal';
