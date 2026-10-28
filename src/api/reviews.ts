import { gql, type GqlOptions } from './client';
import { fragment, operation } from './document';
import { MEDIA_COVER, MEDIA_TITLE, PAGE_INFO, REVIEW_LITE } from './fragments';
import type {
  DeleteReviewMutation,
  RateReviewMutation,
  RateReviewVariables,
  ReviewQuery,
  ReviewsQuery,
  ReviewsVariables,
  ReviewVariables,
  SaveReviewMutation,
  SaveReviewVariables,
} from './types';

const REVIEW_MEDIA = fragment(
  `
fragment ReviewMediaFields on Media {
  id
  type
  format
  isAdult
  bannerImage
  title { ...MediaTitleFields }
  coverImage { ...MediaCoverFields }
}`,
  [MEDIA_TITLE, MEDIA_COVER],
);

export const REVIEW_DETAIL = fragment(
  `
fragment ReviewDetailFields on Review {
  ...ReviewLiteFields
  body(asHtml: $asHtml)
  media { ...ReviewMediaFields }
}`,
  [REVIEW_LITE, REVIEW_MEDIA],
);

export const REVIEW_QUERY = operation(
  `
query Review($id: Int!, $asHtml: Boolean = true) {
  Review(id: $id) { ...ReviewDetailFields }
}`,
  [REVIEW_DETAIL],
);

export const REVIEWS_QUERY = operation(
  `
query Reviews(
  $page: Int = 1
  $perPage: Int = 20
  $mediaId: Int
  $userId: Int
  $mediaType: MediaType
  $sort: [ReviewSort] = [ID_DESC]
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { ...PageInfoFields }
    reviews(mediaId: $mediaId, userId: $userId, mediaType: $mediaType, sort: $sort) {
      ...ReviewLiteFields
      media { ...ReviewMediaFields }
    }
  }
}`,
  [PAGE_INFO, REVIEW_LITE, REVIEW_MEDIA],
);

export const RATE_REVIEW_MUTATION = operation(`
mutation RateReview($reviewId: Int!, $rating: ReviewRating!) {
  RateReview(reviewId: $reviewId, rating: $rating) { id rating ratingAmount userRating }
}`);

export const SAVE_REVIEW_MUTATION = operation(
  `
mutation SaveReview(
  $id: Int
  $mediaId: Int!
  $body: String!
  $summary: String!
  $score: Int!
  $private: Boolean
  $asHtml: Boolean = true
) {
  SaveReview(id: $id, mediaId: $mediaId, body: $body, summary: $summary, score: $score, private: $private) {
    ...ReviewDetailFields
  }
}`,
  [REVIEW_DETAIL],
);

export const DELETE_REVIEW_MUTATION = operation(`
mutation DeleteReview($id: Int!) {
  DeleteReview(id: $id) { deleted }
}`);

export const fetchReview = (vars: ReviewVariables, opts?: GqlOptions) => gql<ReviewQuery>(REVIEW_QUERY, vars, opts);
export const fetchReviews = (vars: ReviewsVariables, opts?: GqlOptions) =>
  gql<ReviewsQuery>(REVIEWS_QUERY, vars, opts);
export const rateReview = (vars: RateReviewVariables, opts?: GqlOptions) =>
  gql<RateReviewMutation>(RATE_REVIEW_MUTATION, vars, opts);
export const saveReview = (vars: SaveReviewVariables, opts?: GqlOptions) =>
  gql<SaveReviewMutation>(SAVE_REVIEW_MUTATION, vars, opts);
export const deleteReview = (id: number, opts?: GqlOptions) =>
  gql<DeleteReviewMutation>(DELETE_REVIEW_MUTATION, { id }, opts);
