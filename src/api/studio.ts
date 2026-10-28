import { gql, type GqlOptions } from './client';
import { operation } from './document';
import { MEDIA_CARD, PAGE_INFO, STUDIO_LITE } from './fragments';
import type { StudioQuery, StudioVariables } from './types';

export const STUDIO_QUERY = operation(
  `
query Studio(
  $id: Int!
  $page: Int = 1
  $perPage: Int = 30
  $sort: [MediaSort] = [START_DATE_DESC]
  $isMain: Boolean
  $onList: Boolean
) {
  Studio(id: $id) {
    ...StudioLiteFields
    media(page: $page, perPage: $perPage, sort: $sort, isMain: $isMain, onList: $onList) {
      pageInfo { ...PageInfoFields }
      edges {
        id
        isMainStudio
        node { ...MediaCardFields }
      }
    }
  }
}`,
  [STUDIO_LITE, PAGE_INFO, MEDIA_CARD],
);

export const fetchStudio = (vars: StudioVariables, opts?: GqlOptions) => gql<StudioQuery>(STUDIO_QUERY, vars, opts);
