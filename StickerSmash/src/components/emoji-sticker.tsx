import { useState } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type EmojiStickerProps = {
  imageSize: number;
  stickerSource: ImageSourcePropType | string;
};

export function EmojiSticker({ imageSize, stickerSource }: EmojiStickerProps) {
  const scale = useSharedValue(imageSize);
  const [position] = useState({ x: 100, y: 120 });

  const onDoubleTap = () => {
    if (scale.value !== imageSize * 2) {
      scale.value = withSpring(imageSize * 2);
    } else {
      scale.value = withSpring(imageSize);
    }
  };

  const imageStyle = useAnimatedStyle(() => {
    return {
      width: scale.value,
      height: scale.value,
    };
  });

  const sourceProp = typeof stickerSource === 'string' ? { uri: stickerSource } : (stickerSource as ImageSourcePropType);

  return (
    <Animated.View style={[styles.stickerContainer, { top: position.y, left: position.x }]}>
      <Pressable onPress={onDoubleTap}>
        <Animated.Image
          source={sourceProp}
          resizeMode="contain"
          style={[imageStyle, { width: imageSize, height: imageSize }]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stickerContainer: {
    position: 'absolute',
    zIndex: 10,
  },
});
