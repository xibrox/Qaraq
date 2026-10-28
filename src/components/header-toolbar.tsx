import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { MediaType } from '@/settings/types';

import type { IconName } from './icon';
import { IconButton } from './icon-button';
import { SearchField, type SearchFieldProps } from './search-field';
import { MediaTypeSwitch } from './segmented-switch';

export type HeaderToolbarProps = {
  /**
   * Optional leading control: an icon button spec (AniClient's list/sidebar glyph on My List,
   * "←" on the pushed Search screen) or any custom node.
   */
  leading?: { icon: IconName; onPress: () => void; accessibilityLabel: string } | ReactNode;
  /** Props for the "Search" field (editable, or button mode with `onPress`). */
  search: SearchFieldProps;
  /** "Anime | Manga" switch value; omit `onMediaTypeChange` to hide the switch. */
  mediaType?: MediaType;
  onMediaTypeChange?: (type: MediaType) => void;
  /** Dims the switch (Explore while loading). */
  mediaTypeDisabled?: boolean;
  /** Extra trailing node after the switch. */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function isIconSpec(v: HeaderToolbarProps['leading']): v is { icon: IconName; onPress: () => void; accessibilityLabel: string } {
  return typeof v === 'object' && v !== null && 'icon' in v && 'onPress' in v;
}

/**
 * AniClient header toolbar row (My List, Explore, Search):
 * [leading icon] [ Search field ] [Anime | Manga]
 */
export function HeaderToolbar({
  leading,
  search,
  mediaType,
  onMediaTypeChange,
  mediaTypeDisabled,
  trailing,
  style,
}: HeaderToolbarProps) {
  return (
    <View style={[styles.row, style]}>
      {isIconSpec(leading) ? (
        <IconButton
          icon={leading.icon}
          onPress={leading.onPress}
          accessibilityLabel={leading.accessibilityLabel}
          variant="plain"
          size={32}
          iconSize={20}
        />
      ) : (
        leading
      )}
      <SearchField {...search} />
      {mediaType && onMediaTypeChange ? (
        <MediaTypeSwitch value={mediaType} onChange={onMediaTypeChange} disabled={mediaTypeDisabled} />
      ) : null}
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
});
