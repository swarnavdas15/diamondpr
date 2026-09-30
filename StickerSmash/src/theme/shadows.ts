import { Platform } from 'react-native';

const createShadow = (
  color: string,
  offsetX: number,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
) => {
  // Convert hex color + opacity to rgba for boxShadow
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return Platform.select({
    web: {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${hexToRgba(color, opacity)}`,
    },
    default: {
      shadowColor: color,
      shadowOffset: { width: offsetX, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation,
    },
  });
};

export const Shadows = {
  sm: createShadow('#0F172A', 0, 1, 0.05, 3, 1),
  md: createShadow('#0F172A', 0, 4, 0.08, 10, 3),
  glowOrange: createShadow('#F86102', 0, 4, 0.25, 8, 4),
};
