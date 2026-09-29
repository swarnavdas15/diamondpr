import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { DepartmentStatus, Order } from '../../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';
import { QuantityProcessModal } from '../QuantityProcessModal';
import { OrderQuantityTracker } from '../OrderQuantityTracker';
import { ExportButton } from '../ui/ExportButton';
import { ExportDataPayload } from '../../utils/exportUtils';

export const DispatchDashboard: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { getMaskedOrders, updateDispatchStage, setSelectedOrder } = useERP();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  const pendingDispatch = getMaskedOrders().filter((o) => {
    if (!o.dispatchRequired || o.dispatchStatus === 'COMPLETED') return false;
    const passedQcQty = o.qualityTestingRequired
      ? (o.qcPassedQuantity !== undefined ? o.qcPassedQuantity : (o.qcResult === 'PASSED' ? (o.qcQuantity || 0) : 0))
      : (o.productionRequired ? (o.productionQuantity || 0) : o.requiredQuantity);
    return passedQcQty > (o.dispatchQuantity || 0);
  });

  const completedDispatch = getMaskedOrders().filter((o) => {
    return o.dispatchRequired && o.dispatchStatus === 'COMPLETED';
  });

  const maskedOrders = activeTab === 'PENDING' ? pendingDispatch : completedDispatch;

  const [transportRefMap, setTransportRefMap] = useState<{ [key: string]: string }>({});
  const [logisticsEntryMap, setLogisticsEntryMap] = useState<{ [key: string]: string }>({});

  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedProcessOrder, setSelectedProcessOrder] = useState<Order | null>(null);

  const getDispatchExportPayload = (): ExportDataPayload => {
    return {
      title: 'Dispatch & Logistics Queue Report',
      filename: 'Dispatch_Orders_Report',
      headers: ['Order No', 'PO Number', 'Dispatched Qty', 'Required Qty', 'Transport Ref', 'Logistics Vehicle', 'Status'],
      rows: maskedOrders.map((o) => [
        o.orderNumber,
        o.poNumber,
        o.dispatchQuantity || 0,
        o.requiredQuantity,
        o.transportRef || 'Pending Transport',
        o.logisticsEntry || 'Pending Logistics',
        o.dispatchStatus,
      ]),
    };
  };

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
    const transportRef = data.transportRef || transportRefMap[selectedProcessOrder.id] || '';
    const logistics = data.logisticsEntry || logisticsEntryMap[selectedProcessOrder.id] || '';
    const newDispQty = (selectedProcessOrder.dispatchQuantity || 0) + data.processedQty;
    const calcStatus: DepartmentStatus = newDispQty >= selectedProcessOrder.requiredQuantity ? 'COMPLETED' : 'IN_PROGRESS';

    updateDispatchStage(selectedProcessOrder.id, calcStatus, logistics || 'Logistics TBD', transportRef || 'Transport TBD', data.remarks || 'Shipment dispatched.', data.processedQty);
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
    <ScrollView style={styles.container} contentContainerStyle={isMobile ? { paddingBottom: 24 } : { paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={[styles.banner, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Dispatch & Logistics Dashboard</Text>
          <Text style={styles.bannerSub}>
            Manage ready-to-ship orders, logistics transport references, and E-Way bills with batch quantity tracking.
          </Text>
        </View>
        <ExportButton getData={getDispatchExportPayload} buttonText="Export Dispatch Data" />
      </View>

      {/* Row 1: Global Order KPI Cards */}
      <OrderKPICards style={{ marginBottom: Spacing.md }} />

      {/* Row 2: Global Task Metrics KPI Cards */}
      <TaskKPICards style={{ marginBottom: Spacing.lg }} />

      {/* Unified Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PENDING' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
            📦 Ready To Ship ({pendingDispatch.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'COMPLETED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
            ✓ Dispatched ({completedDispatch.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dispatch Queue */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{activeTab === 'PENDING' ? 'Ready To Ship Queue' : 'Dispatched Orders'}</Text>

        {maskedOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders currently in ready-to-ship queue.</Text>
        ) : (
          maskedOrders.map((ord) => {
            const passedQcQty = ord.qualityTestingRequired
              ? (ord.qcPassedQuantity !== undefined
                  ? ord.qcPassedQuantity
                  : ord.qcResult === 'PASSED'
                  ? (ord.qcQuantity || 0)
                  : 0)
              : (ord.productionRequired ? (ord.productionQuantity || 0) : ord.requiredQuantity);

            const isQCBlocked = ord.qualityTestingRequired && passedQcQty === 0;
            const dispQty = ord.dispatchQuantity || 0;
            const availableForDispatch = Math.max(0, passedQcQty - dispQty);
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
                        : ord.qcPassedQuantity !== undefined && ord.qcPassedQuantity > 0
                        ? `✓ ${ord.qcPassedQuantity} PCS Passed QC${ord.qcFailedQuantity ? ` (${ord.qcFailedQuantity} PCS in Rework)` : ''}`
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
                      Quality Testing Required = YES, but QC passed quantity is 0 (Status: {ord.qualityStatus}, Result: {ord.qcResult || 'PENDING'}). Production/QC team must inspect and PASS units before dispatch can proceed.
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm - 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '800',
  },
});
