import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { StatPill } from '@/components/stat-pill';
import { scoreTier } from '@/lib/format';
import { useSetting } from '@/settings';
import { useTheme, type ThemeColors } from '@/theme';

import { mediaIcons } from './media-icons';

/** AniList 0-100 average score -> "8.2" (Star) or "82%" (Smiley). */
export function scoreText(score100: number, type: 'star' | 'smiley'): string {
  return type === 'star' ? (score100 / 10).toFixed(1) : `${Math.round(score100)}%`;
}

export function tierColor(score100: number, colors: ThemeColors): string {
  const tier = scoreTier(score100);
  return tier === 'high' ? colors.scoreHigh : tier === 'mid' ? colors.scoreMid : colors.scoreLow;
}

type Props = { score: number | null | undefined; style?: StyleProp<ViewStyle> };

/** "AL · 8.2 ★" pill (Star) or "AL · 82% ☺" (Smiley), honoring More Settings > Score Type. */
export function ScorePill({ score, style }: Props) {
  const theme = useTheme();
  const scoreType = useSetting('scoreType');
  if (!score) return <StatPill label="AL" value="-" style={style} />;
  return scoreType === 'star' ? (
    <StatPill label="AL" value={scoreText(score, 'star')} icon={icons.star} iconColor={theme.colors.star} iconPosition="end" style={style} />
  ) : (
    <StatPill
      label="AL"
      value={scoreText(score, 'smiley')}
      icon={mediaIcons.smiley}
      iconColor={tierColor(score, theme.colors)}
      iconPosition="end"
      style={style}
    />
  );
}

/** Inline "8.7 ★" under a trending card title (gray star) or "87% ☺". */
export function InlineScore({ score, style }: Props) {
  const theme = useTheme();
  const scoreType = useSetting('scoreType');
  if (!score) return null;
  return (
    <View style={[styles.inline, style]}>
      <AppText variant="caption1" tone="secondary" weight="700">
        {scoreText(score, scoreType)}
      </AppText>
      {scoreType === 'star' ? (
        <Icon name={icons.star} size={10} color={theme.colors.textSecondary} />
      ) : (
        <Icon name={mediaIcons.smiley} size={11} color={tierColor(score, theme.colors)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
