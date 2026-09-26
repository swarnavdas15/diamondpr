import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CircleButtonProps = {
  onPress: () => void;
};

export function CircleButton({ onPress }: CircleButtonProps) {
  const theme = useTheme();

  return (
    <View style={[styles.circleButtonContainer, { borderColor: '#ffd33d' }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.circleButton,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <SymbolView
          name={{ ios: 'plus', android: 'add', web: 'add' }}
          size={32}
          tintColor={theme.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  circleButtonContainer: {
    width: 68,
    height: 68,
    marginHorizontal: Spacing.four,
    borderWidth: 3,
    borderRadius: 34,
    padding: 3,
  },
  circleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  pressed: {
    opacity: 0.7,
  },
});
