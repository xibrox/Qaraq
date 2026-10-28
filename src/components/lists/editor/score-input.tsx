import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, icons } from '@/components/icon';
import { scoreParts } from '@/components/media-list-row';
import { NativeSegmentedPicker } from '@/components/segmented-picker/native-segmented-picker';
import { formatScore, SCORE_MAX, type ScoreFormat } from '@/lib/format';
import { useTheme } from '@/theme';

import { clampScore, stepScore } from './editor-model';
import { ValueStepper } from './value-stepper';

const SMILEY_SEGMENTS = [
  { value: '0', label: 'None' },
  { value: '1', label: formatScore(1, 'POINT_3', { smileys: 'emoji' }) },
  { value: '2', label: formatScore(2, 'POINT_3', { smileys: 'emoji' }) },
  { value: '3', label: formatScore(3, 'POINT_3', { smileys: 'emoji' }) },
] as const;

type SmileyValue = (typeof SMILEY_SEGMENTS)[number]['value'];

/** Right-aligned score summary: "★9.5/10", "★4/5", or the smiley for 3 Point. */
export function ScoreSummary({ value, format }: { value: number; format: ScoreFormat }) {
  const c = useTheme().colors;
  if (format === 'POINT_3') {
    return (
      <AppText variant="value">{formatScore(value, format, { smileys: 'emoji', empty: '-' })}</AppText>
    );
  }
  const parts = scoreParts(value, format);
  return (
    <View style={styles.summary}>
      <Icon name={icons.star} size={11} color={c.star} />
      <AppText variant="meta" weight="800">
        {parts?.value ?? '0'}
        <AppText variant="caption1" tone="tertiary">
          {`/${SCORE_MAX[format]}`}
        </AppText>
      </AppText>
    </View>
  );
}

export type ScoreInputProps = {
  value: number;
  format: ScoreFormat;
  onChange: (value: number) => void;
  accessibilityLabel?: string;
};

/**
 * Score control for the viewer's scoring system: a native segmented smiley picker for
 * "3 Point Smiley", otherwise the [−] value [+] stepper (step 0.5 for 10 Point Decimal, 1
 * elsewhere) whose value box accepts typing for 100 Point / 10 Point Decimal.
 */
export function ScoreInput({ value, format, onChange, accessibilityLabel = 'Score' }: ScoreInputProps) {
  if (format === 'POINT_3') {
    const current = String(Math.min(3, Math.max(0, Math.round(value)))) as SmileyValue;
    return (
      <NativeSegmentedPicker<SmileyValue>
        segments={SMILEY_SEGMENTS}
        value={current}
        onChange={(v) => onChange(Number(v))}
        style={styles.smileys}
      />
    );
  }
  const typed = format === 'POINT_100' || format === 'POINT_10_DECIMAL';
  return (
    <ValueStepper
      value={value}
      display={format === 'POINT_10_DECIMAL' ? value.toFixed(1) : String(value)}
      onDecrement={() => onChange(stepScore(value, format, -1))}
      onIncrement={() => onChange(stepScore(value, format, 1))}
      onSubmitValue={typed ? (v) => onChange(clampScore(v, format)) : undefined}
      decimal={format === 'POINT_10_DECIMAL'}
      canDecrement={value > 0}
      canIncrement={value < SCORE_MAX[format]}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  smileys: { alignSelf: 'stretch' },
});
