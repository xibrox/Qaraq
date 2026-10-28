import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme, type ThemeColors, type TypographyVariant } from '@/theme';

/** Semantic text colours. */
export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'muted'
  | 'accent'
  | 'onAccent'
  | 'danger'
  | 'star'
  | 'airing'
  | 'success';

const TONE: Record<TextTone, keyof ThemeColors> = {
  primary: 'text',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  muted: 'textMuted',
  accent: 'accent',
  onAccent: 'onAccent',
  danger: 'danger',
  star: 'star',
  airing: 'airing',
  success: 'success',
};

export type AppTextProps = TextProps & {
  /** Typography token (default `body`). */
  variant?: TypographyVariant;
  /** Semantic colour (default `primary`). Ignored when `color` is set. */
  tone?: TextTone;
  /** Explicit colour override. */
  color?: string;
  /** Weight override. */
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /** Uppercase transform (e.g. "SAVE"). */
  uppercase?: boolean;
};

/**
 * The app's text primitive: Nunito (rounded, like AniClient) with the theme typography scale.
 * Use it instead of RN `Text` everywhere so font, size and colour stay consistent.
 */
export function AppText({
  variant = 'body',
  tone = 'primary',
  color,
  weight,
  align,
  uppercase,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const t = theme.typography[variant];
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: theme.fontFamily,
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontWeight: weight ?? t.fontWeight,
          letterSpacing: 'letterSpacing' in t ? t.letterSpacing : undefined,
          color: color ?? theme.colors[TONE[tone]],
          textAlign: align,
          textTransform: uppercase ? 'uppercase' : undefined,
        },
        style,
      ]}
    />
  );
}
