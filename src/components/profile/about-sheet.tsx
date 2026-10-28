import { ScrollView, StyleSheet, View } from 'react-native';

import { AniListMarkdown } from '@/components/activity/markdown/anilist-markdown';
import { RNBottomSheet } from '@/components/activity/rn-bottom-sheet';
import { AppText } from '@/components/app-text';
import { useTheme } from '@/theme';

export type AboutSheetProps = {
  isPresented: boolean;
  onDismiss: () => void;
  name: string;
  /** `about(asHtml: true)`. */
  aboutHtml: string | null | undefined;
  /** "Joined" line, e.g. "Joined March 2019". */
  joined?: string;
};

/** The profile "i" sheet: the user's bio rendered from AniList markdown. */
export function AboutSheet({ isPresented, onDismiss, name, aboutHtml, joined }: AboutSheetProps) {
  const theme = useTheme();
  return (
    <RNBottomSheet isPresented={isPresented} onDismiss={onDismiss} snapPoints={['half', 'full']} containerColor={theme.colors.surface}>
      {isPresented ? (
        <View style={styles.root}>
          <AppText variant="headline" align="center" style={styles.title}>
            {name}
          </AppText>
          {joined ? (
            <AppText variant="footnote" tone="tertiary" align="center">
              {joined}
            </AppText>
          ) : null}
          <ScrollView contentContainerStyle={styles.content}>
            {aboutHtml?.trim() ? (
              <AniListMarkdown html={aboutHtml} />
            ) : (
              <AppText tone="secondary" align="center">
                No bio yet.
              </AppText>
            )}
          </ScrollView>
        </View>
      ) : null}
    </RNBottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { paddingTop: 18, paddingHorizontal: 16 },
  content: { padding: 16, paddingBottom: 40 },
});
