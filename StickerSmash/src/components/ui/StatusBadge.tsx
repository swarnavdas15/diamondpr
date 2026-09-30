import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { StatusColors, Radius } from '../../theme';

export type BadgeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'FAILED' | 'REJECTED' | 'DRAFT' | 'APPROVED' | 'CANCELLED';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  icon?: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style, textStyle, icon, label }) => {
  const getBadgeColors = () => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'APPROVED':
      case 'FULLY_CONVERTED':
        return {
          bg: StatusColors.COMPLETED.bg,
          border: StatusColors.COMPLETED.border,
          text: StatusColors.COMPLETED.text,
        };
      case 'IN_PROGRESS':
      case 'PARTIALLY_CONVERTED':
        return {
          bg: StatusColors.IN_PROGRESS.bg,
          border: StatusColors.IN_PROGRESS.border,
          text: StatusColors.IN_PROGRESS.text,
        };
      case 'FAILED':
      case 'REJECTED':
      case 'LOST':
      case 'CANCELLED':
        return {
          bg: StatusColors.FAILED.bg,
          border: StatusColors.FAILED.border,
          text: StatusColors.FAILED.text,
        };
      case 'DELAYED':
        return {
          bg: StatusColors.DELAYED.bg,
          border: StatusColors.DELAYED.border,
          text: StatusColors.DELAYED.text,
        };
      case 'PENDING':
      case 'DRAFT':
      default:
        return {
          bg: StatusColors.PENDING.bg,
          border: StatusColors.PENDING.border,
          text: StatusColors.PENDING.text,
        };
    }
  };

  const colors = getBadgeColors();
  const displayLabel = label || (status || '').replace(/_/g, ' ');

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }, style]}>
      <Text style={[styles.badgeText, { color: colors.text }, textStyle]}>
        {icon ? `${icon} ` : ''}{displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
