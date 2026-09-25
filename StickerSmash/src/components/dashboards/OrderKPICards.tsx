import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { OrderKPIDetailsModal } from './OrderKPIDetailsModal';

interface OrderKPICardsProps {
  style?: any;
}

export const OrderKPICards: React.FC<OrderKPICardsProps> = ({ style }) => {
  const { getMaskedOrders } = useERP();
  const orders = getMaskedOrders();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'TOTAL_PIPELINE' | 'ACTIVE_WORK_ORDERS' | 'COMPLETION_RATE' | 'BOTTLENECKS'
  >('TOTAL_PIPELINE');

  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status === 'IN_PROGRESS').length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const delayedOrders = orders.filter(
    (o) => o.status === 'IN_PROGRESS' && (o.purchaseStatus === 'PENDING' || o.qcResult === 'FAILED')
  ).length;

  const handleOpenTab = (
    tab: 'TOTAL_PIPELINE' | 'ACTIVE_WORK_ORDERS' | 'COMPLETION_RATE' | 'BOTTLENECKS'
  ) => {
    setActiveTab(tab);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 1. Total Order Pipeline */}
      <TouchableOpacity
        style={styles.widgetCard}
        onPress={() => handleOpenTab('TOTAL_PIPELINE')}
        activeOpacity={0.8}
      >
        <Text style={styles.widgetVal}>{totalOrders}</Text>
        <Text style={styles.widgetLabel}>Total Order Pipeline</Text>
        <View style={styles.widgetBadge}>
          <Text style={styles.widgetBadgeText}>All Departments</Text>
        </View>
      </TouchableOpacity>

      {/* 2. Active Work Orders */}
      <TouchableOpacity
        style={styles.widgetCard}
        onPress={() => handleOpenTab('ACTIVE_WORK_ORDERS')}
        activeOpacity={0.8}
      >
        <Text style={[styles.widgetVal, { color: StatusColors.IN_PROGRESS.border }]}>{activeOrders}</Text>
        <Text style={styles.widgetLabel}>Active Work Orders</Text>
        <View
          style={[
            styles.widgetBadge,
            {
              backgroundColor: StatusColors.IN_PROGRESS.bg,
              borderWidth: 1,
              borderColor: StatusColors.IN_PROGRESS.border,
            },
          ]}
        >
          <Text style={[styles.widgetBadgeText, { color: StatusColors.IN_PROGRESS.text }]}>In Shop Floor</Text>
        </View>
      </TouchableOpacity>

      {/* 3. Overall Completion Rate */}
      <TouchableOpacity
        style={styles.widgetCard}
        onPress={() => handleOpenTab('COMPLETION_RATE')}
        activeOpacity={0.8}
      >
        <Text style={[styles.widgetVal, { color: StatusColors.COMPLETED.bg }]}>{completionRate}%</Text>
        <Text style={styles.widgetLabel}>Overall Completion Rate</Text>
        <View
          style={[
            styles.widgetBadge,
            {
              backgroundColor: StatusColors.COMPLETED.bg,
              borderWidth: 1,
              borderColor: StatusColors.COMPLETED.border,
            },
          ]}
        >
          <Text style={[styles.widgetBadgeText, { color: StatusColors.COMPLETED.text }]}>On Track</Text>
        </View>
      </TouchableOpacity>

      {/* 4. Workflow Bottlenecks */}
      <TouchableOpacity
        style={styles.widgetCard}
        onPress={() => handleOpenTab('BOTTLENECKS')}
        activeOpacity={0.8}
      >
        <Text style={[styles.widgetVal, { color: StatusColors.FAILED.bg }]}>{delayedOrders}</Text>
        <Text style={styles.widgetLabel}>Workflow Bottlenecks</Text>
        <View
          style={[
            styles.widgetBadge,
            {
              backgroundColor: StatusColors.FAILED.bg,
              borderWidth: 1,
              borderColor: StatusColors.FAILED.border,
            },
          ]}
        >
          <Text style={[styles.widgetBadgeText, { color: StatusColors.FAILED.text }]}>Material Delayed</Text>
        </View>
      </TouchableOpacity>

      {/* Detail Analytics Modal */}
      <OrderKPIDetailsModal
        visible={modalVisible}
        activeTab={activeTab}
        onClose={() => setModalVisible(false)}
        onSelectTab={setActiveTab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  widgetVal: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: '900',
  },
  widgetLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  widgetBadge: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  widgetBadgeText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '700',
  },
});
