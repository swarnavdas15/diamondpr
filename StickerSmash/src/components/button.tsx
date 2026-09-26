import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  theme?: 'primary' | 'secondary' | 'outline';
  icon?: string;
  style?: ViewStyle;
};

export function Button({ label, onPress, theme = 'secondary', icon, style }: ButtonProps) {
  const currentTheme = useTheme();

  if (theme === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.buttonContainer, pressed && styles.pressed, style]}>
        <ThemedView style={[styles.button, { backgroundColor: '#ffd33d' }]}>
          {icon && (
            <SymbolView
              name={{ ios: 'photo', android: 'photo_library', web: 'photo' }}
              size={18}
              tintColor="#25292e"
            />
          )}
          <ThemedText style={[styles.buttonLabel, { color: '#25292e' }]}>{label}</ThemedText>
        </ThemedView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.buttonContainer, pressed && styles.pressed, style]}>
      <ThemedView type="backgroundElement" style={styles.button}>
        <ThemedText style={styles.buttonLabel}>{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    maxWidth: '100%',
    height: 50,
    marginVertical: Spacing.one,
  },
  button: {
    borderRadius: Spacing.four,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});
