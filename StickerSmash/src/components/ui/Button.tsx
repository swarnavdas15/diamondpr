import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'success';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondary;
      case 'danger':
        return styles.btnDanger;
      case 'outline':
        return styles.btnOutline;
      case 'success':
        return styles.btnSuccess;
      case 'primary':
      default:
        return styles.btnPrimary;
    }
  };

  const getTextStyle = (): TextStyle => {
    if (variant === 'outline') {
      return styles.textOutline;
    }
    return styles.textLight;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      style={[
        styles.baseButton,
        getVariantStyle(),
        (disabled || isLoading) && styles.btnDisabled,
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? Colors.accentTeal : Colors.white} />
      ) : (
        <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  baseText: {
    fontSize: 13,
    fontWeight: '800',
  },
  btnPrimary: {
    backgroundColor: Colors.accentTeal,
  },
  btnSecondary: {
    backgroundColor: Colors.secondary,
  },
  btnDanger: {
    backgroundColor: Colors.dangerBright,
  },
  btnSuccess: {
    backgroundColor: '#10b981',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  textLight: {
    color: Colors.white,
  },
  textOutline: {
    color: Colors.textLight,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
