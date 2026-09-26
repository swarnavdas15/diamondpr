import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_EMOJIS } from '@/components/emoji-list';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Sticker Smash Features</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Explore stickers, gestures, and Expo Router functionality.
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">Expo documentation</ThemedText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title="Sticker Catalog & Collection">
            <ThemedText type="small">
              Choose from a wide variety of emojis and custom stickers:
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.stickerRow}>
              {DEFAULT_EMOJIS.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.stickerPreview} contentFit="contain" />
              ))}
            </ThemedView>
          </Collapsible>

          <Collapsible title="Double-Tap Gesture Scaling">
            <ThemedText type="small">
              Double-tap any sticker placed on your photo to dynamically double or reset its scale using <ThemedText type="code">react-native-reanimated</ThemedText>.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Device Photo Picker">
            <ThemedText type="small">
              Uses <ThemedText type="code">expo-image-picker</ThemedText> to access media library photos seamlessly on iOS, Android, and Web.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Theme Support (Light & Dark)">
            <ThemedText type="small">
              Automatically adapts to the device color scheme with custom themed primitives <ThemedText type="code">&lt;ThemedView&gt;</ThemedText> and <ThemedText type="code">&lt;ThemedText&gt;</ThemedText>.
            </ThemedText>
          </Collapsible>
        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  stickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
    justifyContent: 'center',
  },
  stickerPreview: {
    width: 44,
    height: 44,
  },
});
