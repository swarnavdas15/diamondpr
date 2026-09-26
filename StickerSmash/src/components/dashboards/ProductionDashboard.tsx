import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { DepartmentStatus, QCResult, Order } from '../../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';
import { QuantityProcessModal } from '../QuantityProcessModal';
import { OrderQuantityTracker } from '../OrderQuantityTracker';

interface ProductionDashboardProps {
  isQCMode?: boolean;
}

export const ProductionDashboard: React.FC<ProductionDashboardProps> = ({ isQCMode = false }) => {
  const { getMaskedOrders, updateProductionStage, updateQualityStage, setSelectedOrder } = useERP();
  const maskedOrders = getMaskedOrders().filter((o) => o.productionRequired || o.qualityTestingRequired);

  const [shopFloorNotesMap, setShopFloorNotesMap] = useState<{ [key: string]: string }>({});
  const [qcRemarksMap, setQcRemarksMap] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'PRODUCTION' | 'QUALITY_TESTING'>(isQCMode ? 'QUALITY_TESTING' : 'PRODUCTION');

  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedProcessOrder, setSelectedProcessOrder] = useState<Order | null>(null);
  const [processStage, setProcessStage] = useState<'PRODUCTION' | 'QUALITY_TESTING'>('PRODUCTION');

  const handleOpenProcessModal = (ord: Order, stage: 'PRODUCTION' | 'QUALITY_TESTING') => {
    setSelectedProcessOrder(ord);
    setProcessStage(stage);
    setProcessModalVisible(true);
  };

  const handleProcessSubmit = (data: {
    processedQty: number;
    remarks?: string;
    qcResult?: QCResult;
  }) => {
    if (!selectedProcessOrder) return;

    if (processStage === 'PRODUCTION') {
      const notes = data.remarks || shopFloorNotesMap[selectedProcessOrder.id] || 'Shop floor machining completed.';
      const newQty = (selectedProcessOrder.productionQuantity || 0) + data.processedQty;
      const calcStatus: DepartmentStatus = newQty >= selectedProcessOrder.requiredQuantity ? 'COMPLETED' : 'IN_PROGRESS';
      updateProductionStage(selectedProcessOrder.id, calcStatus, notes, data.processedQty);
    } else {
      const remarks = data.remarks || qcRemarksMap[selectedProcessOrder.id] || 'Quality inspection completed.';
      const newQcQty = (selectedProcessOrder.qcQuantity || 0) + data.processedQty;
      const calcStatus: DepartmentStatus = newQcQty >= selectedProcessOrder.requiredQuantity ? 'COMPLETED' : 'IN_PROGRESS';
      updateQualityStage(selectedProcessOrder.id, calcStatus, data.qcResult || 'PASSED', remarks, data.processedQty);
    }

    setProcessModalVisible(false);
    setSelectedProcessOrder(null);
  };

  const getComprehensiveBadge = (ord: any) => {
    if (ord.productionStatus !== 'COMPLETED') {
      if (ord.productionStatus === 'IN_PROGRESS') {
        return { label: 'Production In Progress', bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border };
      }
      return { label: 'Production Pending', bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border };
    }

    // Production is Completed
    if (ord.qualityTestingRequired) {
      if (ord.qualityStatus === 'COMPLETED' && ord.qcResult === 'PASSED') {
        return { label: '✓ Ready for Dispatch (QC Passed)', bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border };
      } else if (ord.qcResult === 'FAILED') {
        return { label: '✕ QC Failed', bg: StatusColors.FAILED.bg, text: StatusColors.FAILED.text, border: StatusColors.FAILED.border };
      } else if (ord.qualityStatus === 'IN_PROGRESS') {
        return { label: 'QC In Progress', bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border };
      } else {
        return { label: 'QC Pending', bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border };
      }
    } else {
      return { label: '✓ Ready for Dispatch (Direct)', bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border };
    }
  };

  const productionQueue = maskedOrders.filter((o) => o.productionRequired);
  const qcQueue = maskedOrders.filter((o) => o.qualityTestingRequired);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Unified Top Banner */}
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Unified Production & Quality Testing Dashboard</Text>
          <Text style={styles.bannerSub}>
            Shop floor manufacturing, quality inspection verification, and ready-to-dispatch workflow management.
          </Text>
        </View>
      </View>

      {/* Row 1: Global Order KPI Cards */}
      <OrderKPICards style={{ marginBottom: Spacing.md }} />

      {/* Row 2: Global Task Metrics KPI Cards */}
      <TaskKPICards style={{ marginBottom: Spacing.lg }} />

      {/* Unified Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PRODUCTION' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PRODUCTION')}
        >
          <Text style={[styles.tabText, activeTab === 'PRODUCTION' && styles.tabTextActive]}>
            ⚙️ Production & Shop Floor Queue ({productionQueue.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'QUALITY_TESTING' && styles.tabBtnActiveQC]}
          onPress={() => setActiveTab('QUALITY_TESTING')}
        >
          <Text style={[styles.tabText, activeTab === 'QUALITY_TESTING' && styles.tabTextActive]}>
            🔍 Quality Testing & Inspection ({qcQueue.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 1: PRODUCTION WORK ORDERS QUEUE */}
      {activeTab === 'PRODUCTION' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shop Floor Manufacturing Work Orders</Text>

          {productionQueue.length === 0 ? (
            <Text style={styles.emptyText}>No active production work orders in queue.</Text>
          ) : (
            productionQueue.map((ord) => {
              const badge = getComprehensiveBadge(ord);
              return (
                <View key={ord.id} style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: badge.bg }]}>
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

                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderWidth: 1, borderColor: badge.border }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  {/* Embedded Live Quantity Tracker */}
                  <OrderQuantityTracker order={ord} style={{ marginTop: Spacing.xs }} />

                  {/* Manufacturing Specs */}
                  <View style={styles.specBox}>
                    <Text style={styles.specTitle}>MANUFACTURING SPECIFICATIONS & DRAWINGS</Text>
                    <Text style={styles.specVal}>Drawing Status: <Text style={styles.bold}>{ord.drawingApproved ? '✓ Drawing Approved' : '☐ Drawing Pending'}</Text></Text>
                    <Text style={styles.specVal}>Material Stock Status: <Text style={styles.bold}>{ord.purchaseStatus === 'COMPLETED' ? '✓ Raw Material Received' : '⏳ Procurement Pending'}</Text></Text>
                    <Text style={styles.specVal}>Finished Produced: <Text style={styles.bold}>{ord.productionQuantity || 0} / {ord.requiredQuantity} pcs</Text></Text>
                    <Text style={styles.specVal}>Technical Specs: {ord.technicalRequirements || 'ANSI B16.5 Standard'}</Text>
                    <Text style={styles.specVal}>Batch Quantity: <Text style={styles.bold}>{ord.requiredQuantity} units</Text></Text>
                    <Text style={styles.specVal}>Quality Testing Pipeline: <Text style={styles.bold}>{ord.qualityTestingRequired ? 'YES (Required after production)' : 'NO (Moves directly to dispatch)'}</Text></Text>
                  </View>

                  {/* Progress Notes */}
                  <View style={styles.notesBox}>
                    <Text style={styles.inputLabel}>Shop Floor Operations Update / Progress Remarks:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. CNC lathe serration 80% completed on lathe unit #4..."
                      placeholderTextColor="#94a3b8"
                      value={shopFloorNotesMap[ord.id] !== undefined ? shopFloorNotesMap[ord.id] : ord.shopFloorNotes || ''}
                      onChangeText={(txt) => setShopFloorNotesMap({ ...shopFloorNotesMap, [ord.id]: txt })}
                    />
                  </View>

                  {/* Production Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnStart]}
                      onPress={() => handleOpenProcessModal(ord, 'PRODUCTION')}
                    >
                      <Text style={styles.actionBtnText}>⚙️ Record Finished Quantity (Batch)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnDone]}
                      onPress={() => handleOpenProcessModal(ord, 'PRODUCTION')}
                    >
                      <Text style={styles.actionBtnText}>✓ Production Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* SECTION 2: INTEGRATED QUALITY TESTING QUEUE */}
      {activeTab === 'QUALITY_TESTING' && (
        <View style={styles.sectionCard}>
          <View style={styles.qcHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Quality Assurance & Testing Queue</Text>
              <Text style={styles.qcSubText}>Displaying orders configured with Quality Testing Required = YES.</Text>
            </View>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>✓ Quality Testing Pipeline Active</Text>
            </View>
          </View>

          {qcQueue.length === 0 ? (
            <Text style={styles.emptyText}>No active orders currently require quality testing inspection.</Text>
          ) : (
            qcQueue.map((ord) => {
              const badge = getComprehensiveBadge(ord);

              let qcBadgeStyle = { bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border };
              if (ord.qcResult === 'PASSED') {
                qcBadgeStyle = { bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border };
              } else if (ord.qcResult === 'FAILED') {
                qcBadgeStyle = { bg: StatusColors.FAILED.bg, text: StatusColors.FAILED.text, border: StatusColors.FAILED.border };
              } else if (ord.qualityStatus === 'IN_PROGRESS') {
                qcBadgeStyle = { bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border };
              }

              return (
                <View key={ord.id} style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: qcBadgeStyle.bg }]}>
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

                    <View style={[styles.qcBadge, { backgroundColor: qcBadgeStyle.bg, borderWidth: 1, borderColor: qcBadgeStyle.border }]}>
                      <Text style={[styles.qcBadgeText, { color: qcBadgeStyle.text }]}>QC RESULT: {ord.qcResult}</Text>
                    </View>
                  </View>

                  {/* Embedded Live Quantity Tracker */}
                  <OrderQuantityTracker order={ord} style={{ marginTop: Spacing.xs }} />

                  {/* Testing Standards & Inspection Checklist */}
                  <View style={styles.specBox}>
                    <Text style={styles.specTitle}>INSPECTION & TESTING STANDARDS CHECKLIST</Text>
                    <Text style={styles.specVal}>1. Produced Available for QC: <Text style={styles.bold}>{ord.productionQuantity || 0} pcs</Text></Text>
                    <Text style={styles.specVal}>2. QC Inspected Passed: <Text style={styles.bold}>{ord.qcQuantity || 0} / {ord.productionQuantity || 0} pcs</Text></Text>
                    <Text style={styles.specVal}>3. Hydro-Static Pressure Test: <Text style={styles.bold}>1500 PSI (10 mins hold)</Text></Text>
                    <Text style={styles.specVal}>4. Dimensional Tolerance Verification: <Text style={styles.bold}>±0.5mm Flange Thickness</Text></Text>
                  </View>

                  {/* QC Remarks Input */}
                  <View style={styles.notesBox}>
                    <Text style={styles.inputLabel}>Inspection Records / QC Remarks:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Hydro-test at 1500 PSI passed. NDT flaw test verified clean."
                      placeholderTextColor="#94a3b8"
                      value={qcRemarksMap[ord.id] !== undefined ? qcRemarksMap[ord.id] : ord.qcRemarks || ''}
                      onChangeText={(txt) => setQcRemarksMap({ ...qcRemarksMap, [ord.id]: txt })}
                    />
                  </View>

                  {/* QC Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnPassQC]}
                      onPress={() => handleOpenProcessModal(ord, 'QUALITY_TESTING')}
                    >
                      <Text style={styles.actionBtnText}>🔍 Record QC Inspection Quantity</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Stage-Wise Quantity Process Modal */}
      <QuantityProcessModal
        visible={processModalVisible}
        order={selectedProcessOrder}
        stage={processStage}
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
    backgroundColor: 'rgba(179, 75, 32, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.px6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
  },
  maskingBadgeText: {
    color: Colors.highlightOrange,
    fontSize: 11,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.px10,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: Colors.darkBlue,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.px14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.primaryLight,
  },
  tabBtnActiveQC: {
    backgroundColor: Colors.industrialOrange,
    borderColor: Colors.highlightOrange,
  },
  tabText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '900',
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
  qcHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  qcSubText: {
    color: Colors.primaryLight,
    fontSize: 11,
  },
  filterBadge: {
    backgroundColor: 'rgba(152, 202, 193, 0.2)',
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  filterBadgeText: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
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
  statusBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  qcBadge: {
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  passBg: {
    backgroundColor: Colors.accentTeal,
  },
  failBg: {
    backgroundColor: Colors.industrialOrange,
  },
  pendingBg: {
    backgroundColor: Colors.secondary,
  },
  qcBadgeText: {
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
  notesBox: {
    gap: Spacing.xs,
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
  btnStart: {
    backgroundColor: Colors.accentTeal,
  },
  btnUpdate: {
    backgroundColor: Colors.industrialOrange,
  },
  btnDone: {
    backgroundColor: Colors.secondary,
  },
  btnStartQC: {
    backgroundColor: Colors.accentTeal,
  },
  btnPassQC: {
    backgroundColor: Colors.secondary,
  },
  btnFailQC: {
    backgroundColor: Colors.industrialOrange,
  },
  btnDoneQC: {
    backgroundColor: Colors.primaryLight,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
});
