import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';

interface OrderKPIDetailsModalProps {
  visible: boolean;
  activeTab: 'TOTAL_PIPELINE' | 'ACTIVE_WORK_ORDERS' | 'COMPLETION_RATE' | 'BOTTLENECKS';
  onClose: () => void;
  onSelectTab: (tab: 'TOTAL_PIPELINE' | 'ACTIVE_WORK_ORDERS' | 'COMPLETION_RATE' | 'BOTTLENECKS') => void;
}

export const OrderKPIDetailsModal: React.FC<OrderKPIDetailsModalProps> = ({
  visible,
  activeTab,
  onClose,
  onSelectTab,
}) => {
  const { getMaskedOrders, setSelectedOrder } = useERP();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  if (!currentUser) return null;

  const orders = getMaskedOrders();
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status === 'IN_PROGRESS');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;
  const bottleneckOrders = orders.filter(
    (o) => o.status === 'IN_PROGRESS' && (o.purchaseStatus === 'PENDING' || o.qcResult === 'FAILED')
  );

  const getPillStyle = (status: string) => {
    if (status === 'COMPLETED' || status === 'APPROVED' || status === 'PASSED') {
      return { bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border };
    }
    if (status === 'IN_PROGRESS') {
      return { bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border };
    }
    if (status === 'FAILED' || status === 'REJECTED') {
      return { bg: StatusColors.FAILED.bg, text: StatusColors.FAILED.text, border: StatusColors.FAILED.border };
    }
    return { bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border };
  };

  const applyFilters = (orderList: Order[]) => {
    return orderList.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (deptFilter !== 'ALL') {
        if (deptFilter === 'PURCHASE' && o.purchaseStatus !== 'IN_PROGRESS' && o.purchaseStatus !== 'PENDING') return false;
        if (deptFilter === 'PRODUCTION' && o.productionStatus !== 'IN_PROGRESS') return false;
        if (deptFilter === 'QC' && o.qualityStatus !== 'IN_PROGRESS') return false;
        if (deptFilter === 'DISPATCH' && o.dispatchStatus !== 'IN_PROGRESS') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = o.orderNumber.toLowerCase().includes(q);
        const matchesCode = o.clientCode.toLowerCase().includes(q);
        const matchesName = (o.clientName || '').toLowerCase().includes(q);
        const matchesPo = o.poNumber.toLowerCase().includes(q);
        const matchesStage = o.salesWorkflowStage.toLowerCase().includes(q);
        return matchesNum || matchesCode || matchesName || matchesPo || matchesStage;
      }
      return true;
    });
  };

  const renderTotalPipelineContent = () => {
    const filtered = applyFilters(orders);

    return (
      <View style={{ flex: 1 }}>
        {/* Filters */}
        <View style={styles.filterCard}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search order number, client code, client name, PO ref, stage..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterChipRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['ALL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.chip, statusFilter === st && styles.chipActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                    {st.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterChipRow}>
            <Text style={styles.filterLabel}>Dept Queue:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['ALL', 'PURCHASE', 'PRODUCTION', 'QC', 'DISPATCH'].map((dp) => (
                <TouchableOpacity
                  key={dp}
                  style={[styles.chip, deptFilter === dp && styles.chipActive]}
                  onPress={() => setDeptFilter(dp)}
                >
                  <Text style={[styles.chipText, deptFilter === dp && styles.chipTextActive]}>
                    {dp}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Table View */}
        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.thRow}>
                <Text style={[styles.th, { width: 120 }]}>Order Number</Text>
                <Text style={[styles.th, { width: 100 }]}>Client Code</Text>
                <Text style={[styles.th, { width: 180 }]}>Client Name</Text>
                <Text style={[styles.th, { width: 140 }]}>Sales Stage</Text>
                <Text style={[styles.th, { width: 110 }]}>Purchase</Text>
                <Text style={[styles.th, { width: 110 }]}>Production</Text>
                <Text style={[styles.th, { width: 110 }]}>QC Result</Text>
                <Text style={[styles.th, { width: 110 }]}>Dispatch</Text>
              </View>

              {filtered.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No orders found matching your filters.</Text>
                </View>
              ) : (
                filtered.map((ord) => {
                  const purStyle = getPillStyle(ord.purchaseStatus);
                  const prodStyle = getPillStyle(ord.productionStatus);
                  const qcStyle = getPillStyle(ord.qcResult);
                  const dispStyle = getPillStyle(ord.dispatchStatus);

                  return (
                    <TouchableOpacity
                      key={ord.id}
                      style={styles.trRow}
                      onPress={() => {
                        onClose();
                        setSelectedOrder(ord);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tdHighlight, { width: 120 }]}>{ord.orderNumber}</Text>
                      <Text style={[styles.td, { width: 100 }]}>{ord.clientCode}</Text>
                      <Text style={[styles.tdBold, { width: 180 }]}>{ord.clientName}</Text>
                      <Text style={[styles.tdSmall, { width: 140 }]}>{ord.salesWorkflowStage.replace(/_/g, ' ')}</Text>

                      <View style={{ width: 110 }}>
                        <View style={[styles.statusPill, { backgroundColor: purStyle.bg, borderColor: purStyle.border }]}>
                          <Text style={[styles.statusPillText, { color: purStyle.text }]}>{ord.purchaseStatus}</Text>
                        </View>
                      </View>

                      <View style={{ width: 110 }}>
                        <View style={[styles.statusPill, { backgroundColor: prodStyle.bg, borderColor: prodStyle.border }]}>
                          <Text style={[styles.statusPillText, { color: prodStyle.text }]}>{ord.productionStatus}</Text>
                        </View>
                      </View>

                      <View style={{ width: 110 }}>
                        <View style={[styles.statusPill, { backgroundColor: qcStyle.bg, borderColor: qcStyle.border }]}>
                          <Text style={[styles.statusPillText, { color: qcStyle.text }]}>{ord.qcResult}</Text>
                        </View>
                      </View>

                      <View style={{ width: 110 }}>
                        <View style={[styles.statusPill, { backgroundColor: dispStyle.bg, borderColor: dispStyle.border }]}>
                          <Text style={[styles.statusPillText, { color: dispStyle.text }]}>{ord.dispatchStatus}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    );
  };

  const renderActiveWorkOrdersContent = () => {
    return (
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {activeOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No active work orders currently on the shop floor.</Text>
          </View>
        ) : (
          activeOrders.map((ord) => (
            <TouchableOpacity
              key={ord.id}
              style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: StatusColors.IN_PROGRESS.border }]}
              onPress={() => {
                onClose();
                setSelectedOrder(ord);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumTitle}>{ord.orderNumber} ({ord.clientCode})</Text>
                  <Text style={styles.clientSubText}>Client: <Text style={{ color: Colors.textLight, fontWeight: '700' }}>{ord.clientName}</Text> • PO: {ord.poNumber}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: StatusColors.IN_PROGRESS.bg, borderColor: StatusColors.IN_PROGRESS.border }]}>
                  <Text style={[styles.statusPillText, { color: StatusColors.IN_PROGRESS.text }]}>IN SHOP FLOOR</Text>
                </View>
              </View>

              <View style={styles.stageGrid}>
                <View style={styles.stageBox}>
                  <Text style={styles.stageLabel}>PURCHASE</Text>
                  <Text style={[styles.stageVal, { color: getPillStyle(ord.purchaseStatus).text }]}>{ord.purchaseStatus}</Text>
                </View>
                <View style={styles.stageBox}>
                  <Text style={styles.stageLabel}>PRODUCTION</Text>
                  <Text style={[styles.stageVal, { color: getPillStyle(ord.productionStatus).text }]}>{ord.productionStatus}</Text>
                </View>
                <View style={styles.stageBox}>
                  <Text style={styles.stageLabel}>QUALITY TEST</Text>
                  <Text style={[styles.stageVal, { color: getPillStyle(ord.qcResult).text }]}>{ord.qcResult}</Text>
                </View>
                <View style={styles.stageBox}>
                  <Text style={styles.stageLabel}>DISPATCH</Text>
                  <Text style={[styles.stageVal, { color: getPillStyle(ord.dispatchStatus).text }]}>{ord.dispatchStatus}</Text>
                </View>
              </View>

              <Text style={styles.specText}>Technical Spec: {ord.technicalRequirements || 'Standard Industrial Flange Spec'}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  const renderCompletionRateContent = () => {
    return (
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {/* KPI Overview Box */}
        <View style={styles.statsSummaryRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalOrders}</Text>
            <Text style={styles.statLbl}>Total Orders</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: Colors.successBright }]}>{completedOrders.length}</Text>
            <Text style={styles.statLbl}>Completed Orders</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: Colors.roles.SALES }]}>{activeOrders.length}</Text>
            <Text style={styles.statLbl}>Pending Orders</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: Colors.accentTeal }]}>{completionRate}%</Text>
            <Text style={styles.statLbl}>Overall Rate</Text>
          </View>
        </View>

        {/* Completed Orders List */}
        <Text style={styles.sectionHeaderTitle}>✓ Dispatched & Completed Manufacturing Orders ({completedOrders.length})</Text>

        {completedOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No completed orders yet.</Text>
          </View>
        ) : (
          completedOrders.map((ord) => (
            <TouchableOpacity
              key={ord.id}
              style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: Colors.successBright }]}
              onPress={() => {
                onClose();
                setSelectedOrder(ord);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumTitle}>{ord.orderNumber} ({ord.clientCode})</Text>
                  <Text style={styles.clientSubText}>Client: {ord.clientName} • Qty: {ord.requiredQuantity} pcs</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: Colors.successBright }]}>
                  <Text style={[styles.statusPillText, { color: Colors.successBright }]}>✓ COMPLETED & DISPATCHED</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  const renderBottlenecksContent = () => {
    return (
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeaderTitle}>🚨 Active Workflow Bottlenecks & Operational Delays ({bottleneckOrders.length})</Text>

        {bottleneckOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>✓ Zero workflow bottlenecks detected. All departments running on schedule.</Text>
          </View>
        ) : (
          bottleneckOrders.map((ord) => {
            const isMaterialDelayed = ord.purchaseStatus === 'PENDING';
            const isQCFailed = ord.qcResult === 'FAILED';

            return (
              <TouchableOpacity
                key={ord.id}
                style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: isQCFailed ? '#ef4444' : '#f97316' }]}
                onPress={() => {
                  onClose();
                  setSelectedOrder(ord);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumTitle}>{ord.orderNumber} ({ord.clientCode})</Text>
                    <Text style={styles.clientSubText}>Client: {ord.clientName} • PO Ref: {ord.poNumber}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: isQCFailed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)', borderColor: isQCFailed ? '#ef4444' : '#f97316' }]}>
                    <Text style={[styles.statusPillText, { color: isQCFailed ? '#ef4444' : '#f97316' }]}>
                      {isQCFailed ? '🔴 QC FAILED' : '🟠 MATERIAL DELAYED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.bottleneckAlertBox}>
                  <Text style={styles.alertTitle}>DELAY REASON & IMPACT:</Text>
                  {isMaterialDelayed && (
                    <Text style={styles.alertText}>
                      • Purchase procurement status is <Text style={{ fontWeight: '800', color: Colors.industrialOrange }}>PENDING</Text>. Raw material stock not verified for shop floor machining.
                    </Text>
                  )}
                  {isQCFailed && (
                    <Text style={styles.alertText}>
                      • Quality inspection result is <Text style={{ fontWeight: '800', color: '#ef4444' }}>FAILED</Text>. Order is strictly blocked from dispatch until re-inspection passes.
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>📊 Manufacturing Order Pipeline Analytics</Text>
              <Text style={styles.modalSub}>
                Role Access Scope: <Text style={{ color: Colors.accentTeal, fontWeight: '800' }}>{currentUser.role}</Text>{' '}
                ({currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' ? 'All Orders Unmasked' : 'Strict Client Masking Active'})
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'TOTAL_PIPELINE' && styles.tabBtnActive]}
              onPress={() => onSelectTab('TOTAL_PIPELINE')}
            >
              <Text style={[styles.tabText, activeTab === 'TOTAL_PIPELINE' && styles.tabTextActive]}>
                Total Order Pipeline ({totalOrders})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ACTIVE_WORK_ORDERS' && styles.tabBtnActiveWork]}
              onPress={() => onSelectTab('ACTIVE_WORK_ORDERS')}
            >
              <Text style={[styles.tabText, activeTab === 'ACTIVE_WORK_ORDERS' && styles.tabTextActive]}>
                Active Work Orders ({activeOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'COMPLETION_RATE' && styles.tabBtnActiveDone]}
              onPress={() => onSelectTab('COMPLETION_RATE')}
            >
              <Text style={[styles.tabText, activeTab === 'COMPLETION_RATE' && styles.tabTextActive]}>
                Completion ({completionRate}%)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'BOTTLENECKS' && styles.tabBtnActiveDelay]}
              onPress={() => onSelectTab('BOTTLENECKS')}
            >
              <Text style={[styles.tabText, activeTab === 'BOTTLENECKS' && styles.tabTextActive]}>
                Bottlenecks ({bottleneckOrders.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Body Content */}
          <View style={styles.modalBody}>
            {activeTab === 'TOTAL_PIPELINE' && renderTotalPipelineContent()}
            {activeTab === 'ACTIVE_WORK_ORDERS' && renderActiveWorkOrdersContent()}
            {activeTab === 'COMPLETION_RATE' && renderCompletionRateContent()}
            {activeTab === 'BOTTLENECKS' && renderBottlenecksContent()}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '90%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.xs,
  },
  modalTitle: {
    color: Colors.textLight,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  closeBtnText: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tabBtnActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  tabBtnActiveWork: {
    backgroundColor: Colors.roles.SALES,
    borderColor: Colors.roles.SALES,
  },
  tabBtnActiveDone: {
    backgroundColor: Colors.status.COMPLETED.bg,
    borderColor: Colors.status.COMPLETED.bg,
  },
  tabBtnActiveDelay: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  modalBody: {
    flex: 1,
  },
  filterCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textLight,
    fontSize: 12,
  },
  clearSearch: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    width: 70,
  },
  chip: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    marginRight: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  chipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  listScroll: {
    flex: 1,
  },
  table: {
    minWidth: 800,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.xs,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  th: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: Radius.xs,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  td: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  tdSmall: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  orderCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumTitle: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '800',
  },
  clientSubText: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  stageGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  stageBox: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    padding: 6,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
  },
  stageLabel: {
    color: Colors.textSubtle,
    fontSize: 9,
    fontWeight: '800',
  },
  stageVal: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  specText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
  },
  statVal: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '900',
  },
  statLbl: {
    color: Colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  bottleneckAlertBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginTop: 2,
  },
  alertTitle: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  alertText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
