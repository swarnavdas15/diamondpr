import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  icon: { ios: any; android: any; web: any };
  label: string;
  onPress: () => void;
};

export function IconButton({ icon, label, onPress }: IconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <SymbolView name={icon as any} size={22} tintColor={theme.text} />
      <ThemedText type="small" style={styles.iconButtonLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.half,
  },
  iconButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.6,
  },
});
