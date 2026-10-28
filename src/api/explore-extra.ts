import { gql, type GqlOptions } from './client';
import { argList, operation } from './document';
import { MEDIA_FILTER_ARGS } from './explore';
import { MEDIA_CARD, PAGE_INFO } from './fragments';
import type { MediaCard, MediaSearchVariables, PageOf } from './types';

/**
 * Explore search/browse results. Same filters as `MediaSearch`, plus the plain-text description
 * the AniClient result card shows (4 gray lines under the title).
 */
const browseArgs = argList(MEDIA_FILTER_ARGS);

export const MEDIA_BROWSE_QUERY = operation(
  `
query MediaBrowse($page: Int = 1, $perPage: Int = 25, ${browseArgs.declarations}) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    media(${browseArgs.arguments}) {
      ...MediaCardFields
      description(asHtml: false)
    }
  }
}`,
  [PAGE_INFO, MEDIA_CARD],
);

export type MediaBrowseItem = MediaCard & { description: string | null };
export type MediaBrowseQuery = PageOf<'media', MediaBrowseItem>;
export type MediaBrowseVariables = MediaSearchVariables;

export const fetchMediaBrowse = (vars: MediaBrowseVariables, opts?: GqlOptions) =>
  gql<MediaBrowseQuery>(MEDIA_BROWSE_QUERY, vars, opts);
