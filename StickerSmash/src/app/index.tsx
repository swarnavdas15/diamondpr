import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CircleButton } from '@/components/circle-button';
import { EmojiList } from '@/components/emoji-list';
import { EmojiPicker } from '@/components/emoji-picker';
import { EmojiSticker } from '@/components/emoji-sticker';
import { IconButton } from '@/components/icon-button';
import { ImageViewer } from '@/components/image-viewer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const PlaceholderImage = require('@/assets/images/tutorial-web.png');

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [pickedEmoji, setPickedEmoji] = useState<any>(null);

  const pickImageAsync = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setShowAppOptions(true);
    }
  };

  const onReset = () => {
    setShowAppOptions(false);
    setSelectedImage(null);
    setPickedEmoji(null);
  };

  const onAddSticker = () => {
    setIsModalVisible(true);
  };

  const onModalClose = () => {
    setIsModalVisible(false);
  };

  const onSaveImageAsync = () => {
    if (Platform.OS === 'web') {
      alert('Sticker Smash image saved successfully!');
    } else {
      Alert.alert('Saved!', 'Sticker Smash photo has been saved to your library.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.headerTitleContainer}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Sticker Smash
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Customize photos with stickers & emojis
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.imageContainer}>
          <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage}>
            {pickedEmoji && <EmojiSticker imageSize={50} stickerSource={pickedEmoji} />}
          </ImageViewer>
        </ThemedView>

        {showAppOptions ? (
          <View style={styles.optionsContainer}>
            <View style={styles.optionsRow}>
              <IconButton
                icon={{ ios: 'arrow.counterclockwise', android: 'refresh', web: 'refresh' }}
                label="Reset"
                onPress={onReset}
              />
              <CircleButton onPress={onAddSticker} />
              <IconButton
                icon={{ ios: 'square.and.arrow.down', android: 'download', web: 'download' }}
                label="Save"
                onPress={onSaveImageAsync}
              />
            </View>
          </View>
        ) : (
          <ThemedView style={styles.footerContainer}>
            <Button
              theme="primary"
              label="Choose a photo"
              icon="photo"
              onPress={pickImageAsync}
            />
            <Button
              label="Use this photo"
              onPress={() => setShowAppOptions(true)}
            />
          </ThemedView>
        )}

        <EmojiPicker isVisible={isModalVisible} onClose={onModalClose}>
          <EmojiList onSelect={setPickedEmoji} onCloseModal={onModalClose} />
        </EmojiPicker>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  headerTitleContainer: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  headerTitle: {
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.two,
  },
  optionsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
