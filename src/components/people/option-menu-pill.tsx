import { Chip } from '@/components/chip';
import { icons, type IconName } from '@/components/icon';
import { NativeMenu } from '@/components/menu/native-menu';
import { choiceItems } from '@/components/menu/types';
import { haptics } from '@/lib/haptics';

export type MenuOption<T extends string> = { value: T; label: string; subtitle?: string };

export type OptionMenuPillProps<T extends string> = {
  options: readonly MenuOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Small gray menu header ("Sort By"). */
  title?: string;
  /** Leading glyph on the pill (default: sort arrows "⇕"). */
  icon?: IconName;
  disabled?: boolean;
};

/**
 * AniClient pull-down pill ("⇕ Popularity"): an outlined chip that opens a native menu with a
 * checkmark on the current option. Used for sort orders, voice-actor language and stat metrics.
 */
export function OptionMenuPill<T extends string>({
  options,
  value,
  onChange,
  title,
  icon = icons.sort,
  disabled,
}: OptionMenuPillProps<T>) {
  const current = options.find((o) => o.value === value)?.label ?? '';
  return (
    <NativeMenu
      title={title}
      disabled={disabled}
      items={choiceItems(options, value, (v) => {
        haptics.selection();
        onChange(v);
      })}>
      <Chip label={current} icon={icon} trailingIcon={icons.chevronDown} variant="outlined" size="sm" />
    </NativeMenu>
  );
}
