export const GAMEMODE_CLASSIC = 'classic' as const;
export const GAMEMODE_RANDOMBOUNCE = 'radmonBounce' as const;

export const GAMETYPE_LADDER = 'ladder' as const;
export const GAMETYPE_NORMAL = 'normal' as const;

export type GameMode = 'classic' | 'radmonBounce';

export type GameType = 'ladder' | 'normal';
