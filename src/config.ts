import Constants from 'expo-constants';

type QaraqExtra = {
  anilistClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as QaraqExtra;

/**
 * AniList API client id. Set it in app.json under `expo.extra.anilistClientId`.
 * Register the client at https://anilist.co/settings/developer with the redirect URL
 * below (`qaraq://auth`).
 */
export const ANILIST_CLIENT_ID: string = extra.anilistClientId ?? 'YOUR_CLIENT_ID';

/** True once a real client id has been configured. */
export const IS_ANILIST_CONFIGURED = ANILIST_CLIENT_ID !== '' && ANILIST_CLIENT_ID !== 'YOUR_CLIENT_ID';

/** OAuth redirect URI, must match the one registered on AniList exactly. */
export const ANILIST_REDIRECT_URI = 'qaraq://auth';

export const ANILIST_AUTHORIZE_URL = 'https://anilist.co/api/v2/oauth/authorize';
export const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';
export const ANILIST_SITE_URL = 'https://anilist.co';

export const APP_SCHEME = 'qaraq';
