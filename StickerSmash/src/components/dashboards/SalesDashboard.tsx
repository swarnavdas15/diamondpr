import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';
import { SalesKPICards } from './SalesKPICards';
import { SalesKPIDetailsModal } from './SalesKPIDetailsModal';
import { ExportButton } from '../ui/ExportButton';
import { ExportDataPayload } from '../../utils/exportUtils';

interface SalesDashboardProps {
  onOpenCreateClient: () => void;
  onOpenCreateOrder: () => void;
  onOpenCreateQuotation?: () => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  onOpenCreateClient,
  onOpenCreateOrder,
  onOpenCreateQuotation,
}) => {
  const { quotations, orders, setSelectedOrder } = useERP();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [activeTab, setActiveTab] = useState<'QUOTATIONS' | 'ORDERS'>('QUOTATIONS');
  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [salesModalTab, setSalesModalTab] = useState<'TOTAL' | 'CONVERTED' | 'LOST'>('TOTAL');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpandOrder = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenSalesModal = (tab: 'TOTAL' | 'CONVERTED' | 'LOST') => {
    setSalesModalTab(tab);
    setSalesModalVisible(true);
  };

  const pendingFollowUps = quotations.filter(
    (q) => q.followUpDate && q.status !== 'FULLY_CONVERTED' && q.status !== 'LOST'
  );

  const calculateProgress = (ord: any) => {
    let completedStages = 0;
    let totalStages = 0;

    if (ord.purchaseRequired) {
      totalStages++;
      if (ord.purchaseStatus === 'COMPLETED' || ord.purchaseStatus === 'APPROVED') completedStages++;
    }
    if (ord.productionRequired) {
      totalStages++;
      if (ord.productionStatus === 'COMPLETED' || ord.productionStatus === 'APPROVED') completedStages++;
    }
    if (ord.qualityTestingRequired) {
      totalStages++;
      if (ord.qcResult === 'PASSED' || ord.qualityStatus === 'APPROVED') completedStages++;
    }
    if (ord.dispatchRequired) {
      totalStages++;
      if (ord.dispatchStatus === 'COMPLETED' || ord.dispatchStatus === 'APPROVED') completedStages++;
    }

    // Fallback: if no stages configured, treat as 0% until ORDER_CONFIRMED
    if (totalStages === 0) return ord.salesWorkflowStage === 'ORDER_CONFIRMED' ? 100 : 0;
    return Math.round((completedStages / totalStages) * 100);
  };

  const getSalesExportPayload = (): ExportDataPayload => {
    if (activeTab === 'QUOTATIONS') {
      return {
        title: 'Sales Department - Quotations Report',
        filename: 'Sales_Quotations_Report',
        headers: ['Quotation No', 'Company Name', 'Contact Person', 'Mobile', 'Amount (₹)', 'Sales Exec', 'Status'],
        rows: quotations.map((q) => [
          q.quotationNumber,
          q.companyName,
          q.contactPerson,
          q.mobileNumber,
          q.quotationAmount,
          q.salesExecutive,
          q.status,
        ]),
      };
    } else {
      return {
        title: 'Sales Department - Orders Report',
        filename: 'Sales_Orders_Report',
        headers: ['Order No', 'PO Number', 'Client Code', 'Client Name', 'Required Qty', 'Sales Stage', 'Overall Status'],
        rows: orders.map((o) => [
          o.orderNumber,
          o.poNumber,
          o.clientCode,
          o.clientName || 'N/A',
          o.requiredQuantity,
          o.salesWorkflowStage,
          o.status,
        ]),
      };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={isMobile ? { paddingBottom: 84 } : { paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Top Banner & Quick Actions */}
      <View style={[styles.topBanner, isMobile && styles.topBannerMobile]}>
        <View style={{ flex: 1, paddingRight: isMobile ? 0 : Spacing.md, marginBottom: isMobile ? 10 : 0 }}>
          <Text style={styles.title}>Sales Department Dashboard</Text>
          <Text style={styles.subTitle}>Manage client registrations, quotations, sales order initiation, and real-time order tracking.</Text>
        </View>
        <View style={[styles.btnRow, isMobile && { width: '100%', flexWrap: 'wrap', gap: 6 }]}>
          <ExportButton getData={getSalesExportPayload} buttonText="Export Data" />
          {onOpenCreateQuotation && (
            <TouchableOpacity style={styles.quoteBtn} onPress={onOpenCreateQuotation}>
              <Text style={styles.btnText}>+ Create Quotation</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.clientBtn} onPress={onOpenCreateClient}>
            <Text style={styles.btnText}>+ Register Client</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.orderBtn} onPress={onOpenCreateOrder}>
            <Text style={styles.btnText}>+ Initiate Sales Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tab Switcher: Quotations vs Sales Orders Management */}
      <View style={styles.tabNavRow}>
        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'QUOTATIONS' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('QUOTATIONS')}
        >
          <Text style={[styles.tabNavBtnText, activeTab === 'QUOTATIONS' && styles.tabNavBtnTextActive]}>
            📜 Quotation Pipeline Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'ORDERS' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('ORDERS')}
        >
          <Text style={[styles.tabNavBtnText, activeTab === 'ORDERS' && styles.tabNavBtnTextActive]}>
            📋 Sales Orders & Real-Time Pipeline Tracking ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Row 1: Global Order KPI Cards */}
      <OrderKPICards style={{ marginBottom: Spacing.md }} />

      {/* Row 2: Global Task Metrics KPI Cards */}
      <TaskKPICards style={{ marginBottom: Spacing.lg }} />

      {/* TAB 1: QUOTATIONS OVERVIEW */}
      {activeTab === 'QUOTATIONS' && (
        <>
          {/* Quotation Pipeline Overview Widgets */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Sales Quotation & Conversion Pipeline</Text>
            <SalesKPICards onCardPress={handleOpenSalesModal} />
          </View>

          {/* Pending Follow-Up Reminders Card */}
          {pendingFollowUps.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📅 Pending Quotation Follow-Up Reminders</Text>
              <Text style={styles.sectionSub}>Action required for scheduled sales negotiations and inquiry follow-ups.</Text>

              <View style={{ marginTop: Spacing.sm, gap: Spacing.xs }}>
                {pendingFollowUps.map((q) => (
                  <View key={q.id} style={styles.fupReminderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fupCompText}>
                        {q.quotationNumber} • <Text style={{ fontWeight: '800', color: Colors.textLight }}>{q.companyName}</Text> ({q.clientCode})
                      </Text>
                      <Text style={styles.fupSubText}>
                        Contact: {q.contactPerson} ({q.mobileNumber}) • Executive: {q.salesExecutive}
                      </Text>
                    </View>
                    <View style={styles.fupDateBadge}>
                      <Text style={styles.fupDateBadgeText}>📅 {q.followUpDate}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* TAB 2: DEDICATED SALES ORDERS TAB */}
      {activeTab === 'ORDERS' && (
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <View>
              <Text style={styles.sectionTitle}>Sales Orders Management & Workflow Pipeline</Text>
              <Text style={styles.sectionSub}>Monitor real-time progress across Purchase, Production, Quality Testing, and Dispatch.</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.xs, borderWidth: 1, borderColor: Colors.successBright }}>
              <Text style={{ color: Colors.successBright, fontSize: 11, fontWeight: '800' }}>
                ✓ Custom Stage Access: Authorized (Sales / Super Admin)
              </Text>
            </View>
          </View>

          {isMobile ? (
            <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
              {orders.length === 0 ? (
                <Text style={styles.emptyText}>No sales orders created yet.</Text>
              ) : (
                orders.map((ord) => {
                  const progressPct = calculateProgress(ord);
                  const isExpanded = !!expandedOrders[ord.id];
                  return (
                    <View key={ord.id} style={styles.mobileCard}>
                      <TouchableOpacity
                        style={styles.mobileCardHeader}
                        onPress={() => toggleExpandOrder(ord.id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.mobileCardTitle}>{ord.orderNumber}</Text>
                            <Text style={styles.mobileCardSubBadge}>{ord.clientCode}</Text>
                          </View>
                          <Text style={styles.mobileCardSubtitle}>{ord.requiredQuantity} units</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Text style={{ fontSize: 10, color: Colors.accentTeal, fontWeight: '800' }}>
                            {progressPct}% Done
                          </Text>
                          <Text style={{ color: Colors.textMuted, fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</Text>
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.mobileCardBody}>
                          <Text style={styles.mobileCardDetail}>Client Name: <Text style={styles.mobileCardVal}>{ord.clientName || 'N/A'}</Text></Text>
                          <Text style={styles.mobileCardDetail}>Current Stage: <Text style={styles.mobileCardVal}>{ord.salesWorkflowStage ? ord.salesWorkflowStage.replace(/_/g, ' ') : ord.status}</Text></Text>
                          <View style={{ marginVertical: 6 }}>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                            </View>
                          </View>
                          <Text style={styles.mobileCardDetail}>Created Date: <Text style={styles.mobileCardVal}>{new Date(ord.createdAt).toLocaleDateString()}</Text></Text>
                          <TouchableOpacity
                            style={[styles.viewPipelineBtn, { marginTop: Spacing.xs, alignSelf: 'flex-start' }]}
                            onPress={() => setSelectedOrder(ord)}
                          >
                            <Text style={styles.viewPipelineBtnText}>🔍 VIEW PIPELINE</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                <View style={styles.thRow}>
                  <Text style={[styles.th, { width: 120 }]}>Order Number</Text>
                  <Text style={[styles.th, { width: 100 }]}>Client Code</Text>
                  <Text style={[styles.th, { width: 180 }]}>Client Name</Text>
                  <Text style={[styles.th, { width: 100 }]}>Quantity</Text>
                  <Text style={[styles.th, { width: 150 }]}>Current Stage</Text>
                  <Text style={[styles.th, { width: 110 }]}>Progress %</Text>
                  <Text style={[styles.th, { width: 110 }]}>Created Date</Text>
                  <Text style={[styles.th, { width: 130 }]}>Action</Text>
                </View>

                {orders.length === 0 ? (
                  <Text style={styles.emptyText}>No sales orders created yet.</Text>
                ) : (
                  orders.map((ord) => {
                    const progressPct = calculateProgress(ord);
                    return (
                      <View key={ord.id} style={styles.trRow}>
                        <Text style={[styles.tdHighlight, { width: 120 }]}>{ord.orderNumber}</Text>
                        <Text style={[styles.tdBold, { width: 100 }]}>{ord.clientCode}</Text>
                        <Text style={[styles.td, { width: 180 }]} numberOfLines={1}>{ord.clientName || 'N/A'}</Text>
                        <Text style={[styles.tdBold, { width: 100 }]}>{ord.requiredQuantity} units</Text>

                        <View style={{ width: 150 }}>
                          <Text style={styles.tdStage}>{ord.salesWorkflowStage ? ord.salesWorkflowStage.replace(/_/g, ' ') : ord.status}</Text>
                        </View>

                        <View style={{ width: 110, justifyContent: 'center' }}>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                          </View>
                          <Text style={{ fontSize: 10, color: Colors.accentTeal, fontWeight: '800', marginTop: 2 }}>
                            {progressPct}% Completed
                          </Text>
                        </View>

                        <Text style={[styles.tdSmall, { width: 110 }]}>{new Date(ord.createdAt).toLocaleDateString()}</Text>

                        <View style={{ width: 130 }}>
                          <TouchableOpacity style={styles.viewPipelineBtn} onPress={() => setSelectedOrder(ord)}>
                            <Text style={styles.viewPipelineBtnText}>🔍 VIEW PIPELINE</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Sales KPI Details Modal */}
      <SalesKPIDetailsModal
        visible={salesModalVisible}
        activeTab={salesModalTab}
        onClose={() => setSalesModalVisible(false)}
        onSelectTab={setSalesModalTab}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBanner: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.px18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  title: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  subTitle: {
    color: Colors.accentTeal,
    fontSize: 12,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  quoteBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.md,
    ...Shadows.glowOrange,
  },
  clientBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  orderBtn: {
    backgroundColor: Colors.roles.SALES,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  btnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 4,
  },
  metricsContainer: {
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
  fupReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  fupCompText: {
    color: Colors.accentTeal,
    fontSize: 13,
  },
  fupSubText: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  fupDateBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  fupDateBadgeText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  tabNavRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tabNavBtn: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  tabNavBtnActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  tabNavBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  tabNavBtnTextActive: {
    color: Colors.white,
  },
  table: {
    minWidth: 850,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: Spacing.px6,
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
    backgroundColor: Colors.cardBg,
    paddingVertical: Spacing.px10,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
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
  tdStage: {
    color: Colors.successBright,
    fontSize: 11,
    fontWeight: '800',
  },
  tdSmall: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    padding: Spacing.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.inputBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.successBright,
  },
  viewPipelineBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    alignItems: 'center',
  },
  viewPipelineBtnText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '800',
  },
  mobileCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.cardBg,
  },
  mobileCardTitle: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '800',
  },
  mobileCardSubBadge: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  mobileCardSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  mobileCardBody: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    backgroundColor: Colors.inputBg,
  },
  mobileCardDetail: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  mobileCardVal: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  topBannerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});
