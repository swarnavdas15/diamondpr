import { Image, ImageSource } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

type ImageViewerProps = {
  imgSource: ImageSource | string;
  selectedImage?: string | null;
  children?: React.ReactNode;
};

export function ImageViewer({ imgSource, selectedImage, children }: ImageViewerProps) {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;

  return (
    <View style={styles.imageContainer}>
      <Image source={imageSource} style={styles.image} contentFit="cover" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: 320,
    height: 380,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
