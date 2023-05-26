export const CHATINGTYPE_INCHAT = 'in-chat' as const;
export const CHATINGTYPE_OUTCHAT = 'out-chat' as const;
export const CHATINGTYPE_DELETE = 'delete' as const;
export const CHATINGTYPE_BLOCK = 'block' as const;

export type ChatingType = 'in-chat' | 'out-chat' | 'delete' | 'block';
