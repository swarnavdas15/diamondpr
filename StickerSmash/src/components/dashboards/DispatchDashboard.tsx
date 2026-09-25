import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { DepartmentStatus, Order } from '../../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';
import { QuantityProcessModal } from '../QuantityProcessModal';
import { OrderQuantityTracker } from '../OrderQuantityTracker';

export const DispatchDashboard: React.FC = () => {
  const { getMaskedOrders, updateDispatchStage, setSelectedOrder } = useERP();
  const maskedOrders = getMaskedOrders().filter((o) => o.dispatchRequired);

  const [transportRefMap, setTransportRefMap] = useState<{ [key: string]: string }>({});
  const [logisticsEntryMap, setLogisticsEntryMap] = useState<{ [key: string]: string }>({});

  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedProcessOrder, setSelectedProcessOrder] = useState<Order | null>(null);

  const handleOpenProcessModal = (ord: Order) => {
    setSelectedProcessOrder(ord);
    setProcessModalVisible(true);
  };

  const handleProcessSubmit = (data: {
    processedQty: number;
    remarks?: string;
    transportRef?: string;
    logisticsEntry?: string;
  }) => {
    if (!selectedProcessOrder) return;
    const transportRef = data.transportRef || transportRefMap[selectedProcessOrder.id] || 'TRP-10-TON-CONTAINER-4491';
    const logistics = data.logisticsEntry || logisticsEntryMap[selectedProcessOrder.id] || 'VRL Logistics Container Truck #MH-12-AB-9876';
    const newDispQty = (selectedProcessOrder.dispatchQuantity || 0) + data.processedQty;
    const calcStatus: DepartmentStatus = newDispQty >= selectedProcessOrder.requiredQuantity ? 'COMPLETED' : 'IN_PROGRESS';

    updateDispatchStage(selectedProcessOrder.id, calcStatus, logistics, transportRef, data.remarks || 'Shipment dispatched.', data.processedQty);
    setProcessModalVisible(false);
    setSelectedProcessOrder(null);
  };

  const getStatusBadgeStyle = (status: DepartmentStatus, dispQty: number = 0, reqQty: number = 50) => {
    if (dispQty >= reqQty && reqQty > 0) {
      return { bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border, label: 'COMPLETED (100%)' };
    }
    if (dispQty > 0) {
      return { bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border, label: `PARTIALLY DISPATCHED (${dispQty}/${reqQty})` };
    }
    return { bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border, label: 'PENDING' };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Dispatch & Logistics Dashboard</Text>
          <Text style={styles.bannerSub}>
            Manage ready-to-ship orders, logistics transport references, and E-Way bills with batch quantity tracking.
          </Text>
        </View>
      </View>

      {/* Row 1: Global Order KPI Cards */}
      <OrderKPICards style={{ marginBottom: Spacing.md }} />

      {/* Row 2: Global Task Metrics KPI Cards */}
      <TaskKPICards style={{ marginBottom: Spacing.lg }} />

      {/* Dispatch Queue */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Ready To Ship Queue</Text>

        {maskedOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders currently in ready-to-ship queue.</Text>
        ) : (
          maskedOrders.map((ord) => {
            const isQCBlocked = ord.qualityTestingRequired && (ord.qualityStatus !== 'COMPLETED' || ord.qcResult !== 'PASSED');
            const dispQty = ord.dispatchQuantity || 0;
            const availableForDispatch = Math.max(0, (ord.qualityTestingRequired ? (ord.qcQuantity || 0) : (ord.productionQuantity || 0)) - dispQty);
            const badgeStyle = getStatusBadgeStyle(ord.dispatchStatus, dispQty, ord.requiredQuantity);

            return (
              <View key={ord.id} style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: badgeStyle.bg }]}>
                <View style={styles.cardHeader}>
                  <TouchableOpacity onPress={() => setSelectedOrder(ord)}>
                    <View style={styles.orderRefRow}>
                      <Text style={styles.orderNum}>{ord.orderNumber}</Text>
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>Client Code: {ord.clientCode}</Text>
                      </View>
                    </View>
                    <Text style={styles.poNumberText}>PO Ref: {ord.poNumber}</Text>
                  </TouchableOpacity>

                  <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg, borderWidth: 1, borderColor: badgeStyle.border }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>{badgeStyle.label}</Text>
                  </View>
                </View>

                {/* Embedded Live Quantity Tracker */}
                <OrderQuantityTracker order={ord} style={{ marginTop: Spacing.xs }} />

                {/* Status Verification Checks */}
                <View style={styles.specBox}>
                  <Text style={styles.specTitle}>PRE-SHIPMENT VERIFICATION CHECKLIST</Text>
                  <Text style={styles.specVal}>Ready for Dispatch Available: <Text style={[styles.bold, { color: Colors.successBright }]}>{availableForDispatch} PCS</Text></Text>
                  <Text style={styles.specVal}>Dispatched So Far: <Text style={styles.bold}>{dispQty} / {ord.requiredQuantity} PCS</Text></Text>
                  <Text style={styles.specVal}>Production Work Order: <Text style={styles.bold}>{ord.productionStatus === 'COMPLETED' ? '✓ Completed' : '⏳ Pending'}</Text></Text>
                  <Text style={styles.specVal}>
                    Quality Testing Inspection:{' '}
                    <Text style={styles.bold}>
                      {!ord.qualityTestingRequired
                        ? '✓ Not Required (Direct Dispatch)'
                        : ord.qualityStatus === 'COMPLETED' && ord.qcResult === 'PASSED'
                        ? '✓ Inspection Passed'
                        : ord.qcResult === 'FAILED'
                        ? '✕ Inspection Failed'
                        : '⏳ Inspection Pending'}
                    </Text>
                  </Text>
                </View>

                {/* Dispatch Blocked Warning Alert */}
                {isQCBlocked && (
                  <View style={styles.blockedAlertBox}>
                    <Text style={styles.blockedAlertTitle}>🔒 DISPATCH STRICTLY BLOCKED</Text>
                    <Text style={styles.blockedAlertText}>
                      Quality Testing Required = YES, but QC status is {ord.qualityStatus} ({ord.qcResult}). Production/QC team must inspect and PASS this order before dispatch can proceed.
                    </Text>
                  </View>
                )}

                {/* Logistics & Transport Entry */}
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Transport Docket / LR Reference Number:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. TRP-10-TON-CONTAINER-4491"
                    placeholderTextColor="#94a3b8"
                    value={transportRefMap[ord.id] !== undefined ? transportRefMap[ord.id] : ord.transportRef || ''}
                    onChangeText={(txt) => setTransportRefMap({ ...transportRefMap, [ord.id]: txt })}
                  />

                  <Text style={styles.inputLabel}>Logistics Provider & Vehicle Details:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. VRL Logistics / Truck #MH-12-AB-9876"
                    placeholderTextColor="#94a3b8"
                    value={logisticsEntryMap[ord.id] !== undefined ? logisticsEntryMap[ord.id] : ord.logisticsEntry || ''}
                    onChangeText={(txt) => setLogisticsEntryMap({ ...logisticsEntryMap, [ord.id]: txt })}
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnDispatched, isQCBlocked && styles.btnDisabled]}
                    disabled={isQCBlocked}
                    onPress={() => handleOpenProcessModal(ord)}
                  >
                    <Text style={styles.actionBtnText}>{isQCBlocked ? '🔒 QC Blocked' : '🚚 Record Dispatch Shipment (Batch)'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Stage-Wise Quantity Process Modal */}
      <QuantityProcessModal
        visible={processModalVisible}
        order={selectedProcessOrder}
        stage="DISPATCH"
        onClose={() => setProcessModalVisible(false)}
        onSubmit={handleProcessSubmit}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    backgroundColor: Colors.darkBlue,
    borderRadius: Radius.xl,
    padding: Spacing.px18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  bannerTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  bannerSub: {
    color: Colors.primaryLight,
    fontSize: 12,
    marginTop: 2,
  },
  maskingBadge: {
    backgroundColor: 'rgba(75, 113, 114, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.px6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  maskingBadgeText: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: Colors.darkBlue,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: Spacing.xl,
  },
  orderCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.lg,
    padding: Spacing.px14,
    marginBottom: Spacing.px14,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.px10,
  },
  orderRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  orderNum: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  codeBadge: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  codeBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  maskedTag: {
    backgroundColor: 'rgba(179, 75, 32, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  maskedTagText: {
    color: Colors.highlightOrange,
    fontSize: 11,
    fontWeight: '700',
  },
  poNumberText: {
    color: Colors.primaryLight,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  doneBg: {
    backgroundColor: Colors.secondary,
  },
  inProgBg: {
    backgroundColor: Colors.accentTeal,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  specBox: {
    backgroundColor: Colors.darkBlue,
    borderRadius: Radius.md,
    padding: Spacing.px10,
    marginBottom: Spacing.px10,
    gap: 2,
  },
  specTitle: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  specVal: {
    color: Colors.textLight,
    fontSize: 12,
  },
  bold: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  blockedAlertBox: {
    backgroundColor: 'rgba(179, 75, 32, 0.15)',
    borderRadius: Radius.md,
    padding: Spacing.px10,
    marginBottom: Spacing.px10,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
  },
  blockedAlertTitle: {
    color: Colors.highlightOrange,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  blockedAlertText: {
    color: Colors.textLight,
    fontSize: 11,
    lineHeight: 16,
  },
  inputBox: {
    gap: Spacing.px6,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.darkBlue,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.px6,
    color: Colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.px6,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  btnReady: {
    backgroundColor: Colors.accentTeal,
  },
  btnDispatched: {
    backgroundColor: Colors.industrialOrange,
  },
  btnTransported: {
    backgroundColor: Colors.secondary,
  },
  btnDisabled: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    opacity: 0.6,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
});
