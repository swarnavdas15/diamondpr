import { Image, ImageSource } from 'expo-image';
import { useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

type EmojiListProps = {
  onSelect: (image: ImageSource | string) => void;
  onCloseModal: () => void;
};

export const DEFAULT_EMOJIS = [
  'https://emojiapi.dev/api/v1/sparkles/128.png',
  'https://emojiapi.dev/api/v1/fire/128.png',
  'https://emojiapi.dev/api/v1/smiling_face_with_sunglasses/128.png',
  'https://emojiapi.dev/api/v1/rocket/128.png',
  'https://emojiapi.dev/api/v1/gem_stone/128.png',
  'https://emojiapi.dev/api/v1/party_popper/128.png',
  'https://emojiapi.dev/api/v1/star/128.png',
  'https://emojiapi.dev/api/v1/heart_hands/128.png',
];

export function EmojiList({ onSelect, onCloseModal }: EmojiListProps) {
  const [emoji] = useState<string[]>(DEFAULT_EMOJIS);

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={Platform.OS === 'web'}
      data={emoji}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            onSelect(item);
            onCloseModal();
          }}
          style={({ pressed }) => [styles.emojiPressable, pressed && styles.pressed]}>
          <Image source={{ uri: item }} style={styles.image} contentFit="contain" />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  emojiPressable: {
    padding: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    width: 60,
    height: 60,
  },
  pressed: {
    opacity: 0.7,
  },
});
