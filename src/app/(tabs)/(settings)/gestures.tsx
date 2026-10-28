import { useState } from 'react';

import {
  SettingsButtonRow,
  SettingsCustomRow,
  SettingsForm,
  SettingsSection,
  SettingsSegmentedRow,
  SettingsValueRow,
  type SettingsOption,
} from '@/components/settings';
import { GesturePreview } from '@/components/settings/gesture-preview';
import { haptics } from '@/lib/haptics';
import {
  getSettings,
  MEDIA_TYPE_LABELS,
  resetSwipeGestures,
  setSwipeAction,
  SWIPE_ACTIONS,
  swipeActionLabel,
  useSwipeGestures,
  type MediaType,
  type SwipeAction,
} from '@/settings';

const SEGMENTS = [
  { value: 'ANIME', label: MEDIA_TYPE_LABELS.ANIME },
  { value: 'MANGA', label: MEDIA_TYPE_LABELS.MANGA },
] as const satisfies readonly { value: MediaType; label: string }[];

function actionOptions(type: MediaType): SettingsOption<SwipeAction>[] {
  return SWIPE_ACTIONS.map((value) => ({ value, label: swipeActionLabel(value, type) }));
}

/** "Gesture Settings": per media type swipe actions with live previews. */
export default function GestureSettingsScreen() {
  const [type, setType] = useState<MediaType>(() => getSettings().defaultMediaType);
  const gestures = useSwipeGestures(type);
  const options = actionOptions(type);

  return (
    <SettingsForm>
      <SettingsSegmentedRow segments={SEGMENTS} value={type} onChange={setType} />

      <SettingsSection>
        <SettingsCustomRow>
          <GesturePreview mediaType={type} direction="right" action={gestures.right} />
        </SettingsCustomRow>
        <SettingsValueRow
          title="Swipe Right"
          value={gestures.right}
          options={options}
          onChange={(v) => setSwipeAction(type, 'right', v)}
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsCustomRow>
          <GesturePreview mediaType={type} direction="left" action={gestures.left} />
        </SettingsCustomRow>
        <SettingsValueRow
          title="Swipe Left"
          value={gestures.left}
          options={options}
          onChange={(v) => setSwipeAction(type, 'left', v)}
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsButtonRow
          title={`Reset ${MEDIA_TYPE_LABELS[type]} Gestures`}
          align="center"
          onPress={() => {
            resetSwipeGestures(type);
            haptics.success();
          }}
        />
      </SettingsSection>
    </SettingsForm>
  );
}
