import {
  SettingsCheckRow,
  SettingsForm,
  SettingsSection,
  SettingsValueRow,
  type SettingsOption,
} from '@/components/settings';
import { SCORE_TYPE_LABELS, SCORE_TYPES, setSetting, useSettings, type ScoreType } from '@/settings';

const SCORE_TYPE_OPTIONS = SCORE_TYPES.map((value): SettingsOption<ScoreType> => ({ value, label: SCORE_TYPE_LABELS[value] }));

/** "More Settings". */
export default function MoreSettingsScreen() {
  const s = useSettings((st) => ({
    displayMyActivityInFollowing: st.displayMyActivityInFollowing,
    expandSummaryByDefault: st.expandSummaryByDefault,
    hideMangaChapters: st.hideMangaChapters,
    hideMangaVolumes: st.hideMangaVolumes,
    scoreType: st.scoreType,
  }));

  return (
    <SettingsForm>
      <SettingsSection title="Activity Feed">
        <SettingsCheckRow
          title="Display My Activity in Following"
          checked={s.displayMyActivityInFollowing}
          onToggle={(v) => setSetting('displayMyActivityInFollowing', v)}
        />
      </SettingsSection>

      <SettingsSection title="Media Details">
        <SettingsCheckRow
          title="Expand Summary By Default"
          checked={s.expandSummaryByDefault}
          onToggle={(v) => setSetting('expandSummaryByDefault', v)}
        />
      </SettingsSection>

      <SettingsSection title="My List (Manga)">
        <SettingsCheckRow title="Hide Chapters" checked={s.hideMangaChapters} onToggle={(v) => setSetting('hideMangaChapters', v)} />
        <SettingsCheckRow title="Hide Volumes" checked={s.hideMangaVolumes} onToggle={(v) => setSetting('hideMangaVolumes', v)} />
      </SettingsSection>

      <SettingsSection title="Search">
        <SettingsValueRow
          title="Score Type"
          value={s.scoreType}
          options={SCORE_TYPE_OPTIONS}
          onChange={(v) => setSetting('scoreType', v)}
        />
      </SettingsSection>
    </SettingsForm>
  );
}
