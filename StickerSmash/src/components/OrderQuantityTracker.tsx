import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Order } from '../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../theme';

interface OrderQuantityTrackerProps {
  order: Order;
  style?: ViewStyle;
}

export const OrderQuantityTracker: React.FC<OrderQuantityTrackerProps> = ({ order, style }) => {
  const totalQty = order.requiredQuantity || 1;
  const purQty = order.purchaseQuantity || 0;
  const prodQty = order.productionQuantity || 0;
  const qcQty = order.qcQuantity || 0;
  const dispQty = order.dispatchQuantity || 0;

  // Calculation of availability & progress
  const availableForDispatch = Math.max(
    0,
    (order.qualityTestingRequired ? qcQty : prodQty) - dispQty
  );
  const pendingProduction = Math.max(0, totalQty - prodQty);

  const getPercent = (current: number, total: number) => {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((current / total) * 100));
  };

  const purPct = getPercent(purQty, totalQty);
  const prodPct = getPercent(prodQty, totalQty);
  const qcPct = order.qualityTestingRequired ? getPercent(qcQty, prodQty > 0 ? prodQty : totalQty) : 100;
  const dispPct = getPercent(dispQty, totalQty);

  return (
    <View style={[styles.container, style]}>
      {/* Tracker Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>📊 Quantity Tracking & Batch Progression</Text>
        <View style={styles.totalQtyBadge}>
          <Text style={styles.totalQtyText}>Total Order: {totalQty} PCS</Text>
        </View>
      </View>

      {/* Cross-Department Live Status Summary Badges */}
      <View style={styles.summaryBadgeRow}>
        {availableForDispatch > 0 && (
          <View style={styles.readyBadge}>
            <Text style={styles.readyBadgeText}>⚡ Ready for Dispatch: {availableForDispatch} PCS</Text>
          </View>
        )}
        {pendingProduction > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>⏳ Pending Production: {pendingProduction} PCS</Text>
          </View>
        )}
        {dispQty >= totalQty && totalQty > 0 && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Order 100% Dispatched</Text>
          </View>
        )}
      </View>

      {/* Stage-Wise Quantity Grid */}
      <View style={styles.stageGrid}>
        {/* Stage 1: Purchase */}
        {order.purchaseRequired && (
          <View style={styles.stageBox}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageIcon}>🛒</Text>
              <Text style={styles.stageName}>Purchase</Text>
            </View>
            <Text style={styles.stageRatio}>{purQty} / {totalQty} PCS</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${purPct}%`, backgroundColor: purPct >= 100 ? Colors.successBright : Colors.roles.PURCHASE }]} />
            </View>
            <Text style={styles.pctText}>{purPct}% Received</Text>
          </View>
        )}

        {/* Stage 2: Production */}
        {order.productionRequired && (
          <View style={styles.stageBox}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageIcon}>🏭</Text>
              <Text style={styles.stageName}>Production</Text>
            </View>
            <Text style={styles.stageRatio}>{prodQty} / {totalQty} PCS</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${prodPct}%`, backgroundColor: prodPct >= 100 ? Colors.successBright : Colors.industrialOrange }]} />
            </View>
            <Text style={styles.pctText}>{prodPct}% Finished</Text>
          </View>
        )}

        {/* Stage 3: Quality Testing */}
        {order.qualityTestingRequired && (
          <View style={styles.stageBox}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageIcon}>🔍</Text>
              <Text style={styles.stageName}>QC Testing</Text>
            </View>
            <Text style={styles.stageRatio}>{qcQty} / {prodQty} PCS</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${qcPct}%`, backgroundColor: qcPct >= 100 ? Colors.successBright : Colors.accentTeal }]} />
            </View>
            <Text style={styles.pctText}>{qcPct}% Tested</Text>
          </View>
        )}

        {/* Stage 4: Dispatch */}
        {order.dispatchRequired && (
          <View style={styles.stageBox}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageIcon}>📦</Text>
              <Text style={styles.stageName}>Dispatch</Text>
            </View>
            <Text style={styles.stageRatio}>{dispQty} / {totalQty} PCS</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${dispPct}%`, backgroundColor: dispPct >= 100 ? Colors.successBright : Colors.roles.SALES }]} />
            </View>
            <Text style={styles.pctText}>{dispPct}% Shipped</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  totalQtyBadge: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  totalQtyText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  readyBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: Colors.successBright,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  readyBadgeText: {
    color: Colors.successBright,
    fontSize: 10,
    fontWeight: '800',
  },
  pendingBadge: {
    backgroundColor: 'rgba(179, 75, 32, 0.12)',
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  pendingBadgeText: {
    color: Colors.industrialOrange,
    fontSize: 10,
    fontWeight: '800',
  },
  completedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: Colors.successBright,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  completedBadgeText: {
    color: Colors.successBright,
    fontSize: 10,
    fontWeight: '800',
  },
  stageGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stageBox: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stageIcon: {
    fontSize: 12,
  },
  stageName: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  stageRatio: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  barTrack: {
    height: 5,
    backgroundColor: Colors.inputBg,
    borderRadius: 3,
    marginVertical: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  pctText: {
    color: Colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
  },
});
