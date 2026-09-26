import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmojiPickerProps = {
  isVisible: boolean;
  children: React.ReactNode;
  onClose: () => void;
};

export function EmojiPicker({ isVisible, children, onClose }: EmojiPickerProps) {
  const theme = useTheme();

  return (
    <Modal animationType="slide" transparent visible={isVisible}>
      <View style={styles.modalContent}>
        <ThemedView type="backgroundElement" style={styles.titleContainer}>
          <ThemedText type="smallBold">Choose a sticker</ThemedText>
          <Pressable onPress={onClose} style={({ pressed }) => pressed && styles.pressed}>
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
              size={22}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        </ThemedView>
        <ThemedView style={styles.childrenContainer}>{children}</ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    height: '28%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopRightRadius: Spacing.four,
    borderTopLeftRadius: Spacing.four,
    overflow: 'hidden',
  },
  titleContainer: {
    height: '25%',
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childrenContainer: {
    flex: 1,
    paddingVertical: Spacing.two,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
