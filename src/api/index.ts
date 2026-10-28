/**
 * AniList API layer.
 *
 *   import { useMediaDetail, setTokenGetter, type MediaCard } from '@/api';
 *
 * Every operation string is validated against docs/anilist-schema.json by
 * `bun run scripts/validate-graphql.ts`.
 */
export * from './client';
export * from './document';
export * from './fragments';
export * from './types';

export * from './viewer';
export * from './lists';
export * from './media';
export * from './explore';
export * from './character';
export * from './staff';
export * from './studio';
export * from './user';
export * from './activity';
export * from './notifications';
export * from './favourites';
export * from './settings';
export * from './reviews';
export * from './airing';

export * from './queries/hooks';
