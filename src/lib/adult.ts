import type { Settings } from '@/settings/types';

type AdultSettings = Pick<Settings, 'showAdultContent' | 'blurAdultContent'>;

type MaybeAdult = { isAdult?: boolean | null } | null | undefined;

/**
 * Should this media's cover/banner be blurred?
 * Blur applies to adult media whenever the blur setting is on, even if adult content is shown
 * (AniClient behaviour: content appears in results but covers are blurred until tapped).
 */
export function shouldBlur(media: MaybeAdult, settings: AdultSettings): boolean {
  return !!media?.isAdult && settings.blurAdultContent;
}

/** Should this media be hidden entirely (e.g. from explore/search) */
export function shouldHide(media: MaybeAdult, settings: AdultSettings): boolean {
  return !!media?.isAdult && !settings.showAdultContent;
}

/**
 * Value for the GraphQL `isAdult` argument on Page.media queries:
 * `false` hides adult media; `undefined` leaves the filter off (both allowed).
 */
export function isAdultQueryArg(settings: AdultSettings): false | undefined {
  return settings.showAdultContent ? undefined : false;
}

/** Filter a list of media according to the setting. */
export function filterAdult<T extends { isAdult?: boolean | null }>(items: T[], settings: AdultSettings): T[] {
  return settings.showAdultContent ? items : items.filter((m) => !m.isAdult);
}

/** Blur radius to use on expo-image when blurring adult covers. */
export const ADULT_BLUR_RADIUS = 40;
