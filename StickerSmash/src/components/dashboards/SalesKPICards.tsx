import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface SalesKPICardsProps {
  onCardPress: (tab: 'TOTAL' | 'CONVERTED' | 'LOST') => void;
  style?: ViewStyle;
}

export const SalesKPICards: React.FC<SalesKPICardsProps> = ({ onCardPress, style }) => {
  const { quotations } = useERP();

  const totalQuotations = quotations.length;
  const totalQuotationValue = quotations.reduce((acc, q) => acc + q.quotationAmount, 0);
  const convertedValue = quotations.reduce((acc, q) => acc + (q.convertedOrderValue || 0), 0);
  const lostBusinessValue = quotations.reduce((acc, q) => acc + (q.lostValue || 0), 0);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <View style={[styles.container, style]}>
      {/* Card 1: Total Quotations */}
      <TouchableOpacity
        style={[styles.metricCard, { borderLeftColor: Colors.accentTeal }]}
        activeOpacity={0.7}
        onPress={() => onCardPress('TOTAL')}
      >
        <View style={[styles.metricIconBg, { backgroundColor: Colors.accentTeal }]}>
          <Text style={styles.metricIconText}>📜</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.metricVal}>{formatCurrency(totalQuotationValue)}</Text>
          <Text style={styles.metricLbl}>{totalQuotations} Total Quotations</Text>
        </View>
        <View style={styles.badgeHint}>
          <Text style={styles.badgeHintText}>View All ↗</Text>
        </View>
      </TouchableOpacity>

      {/* Card 2: Converted Orders Value */}
      <TouchableOpacity
        style={[styles.metricCard, { borderLeftColor: Colors.successBright }]}
        activeOpacity={0.7}
        onPress={() => onCardPress('CONVERTED')}
      >
        <View style={[styles.metricIconBg, { backgroundColor: Colors.successBright }]}>
          <Text style={styles.metricIconText}>💰</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metricVal, { color: Colors.successBright }]}>{formatCurrency(convertedValue)}</Text>
          <Text style={styles.metricLbl}>Converted Orders Value</Text>
        </View>
        <View style={[styles.badgeHint, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
          <Text style={[styles.badgeHintText, { color: Colors.successBright }]}>Analytics ↗</Text>
        </View>
      </TouchableOpacity>

      {/* Card 3: Lost Business Value */}
      <TouchableOpacity
        style={[styles.metricCard, { borderLeftColor: Colors.industrialOrange }]}
        activeOpacity={0.7}
        onPress={() => onCardPress('LOST')}
      >
        <View style={[styles.metricIconBg, { backgroundColor: Colors.industrialOrange }]}>
          <Text style={styles.metricIconText}>📉</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metricVal, { color: Colors.industrialOrange }]}>{formatCurrency(lostBusinessValue)}</Text>
          <Text style={styles.metricLbl}>Lost Business Value</Text>
        </View>
        <View style={[styles.badgeHint, { backgroundColor: 'rgba(179, 75, 32, 0.12)' }]}>
          <Text style={[styles.badgeHintText, { color: Colors.industrialOrange }]}>Analysis ↗</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderLeftWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
    cursor: 'pointer' as any,
  },
  metricIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricIconText: {
    fontSize: 18,
    color: Colors.white,
  },
  metricVal: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  metricLbl: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeHint: {
    backgroundColor: 'rgba(41, 88, 92, 0.1)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  badgeHintText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentTeal,
  },
});
