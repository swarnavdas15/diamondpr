import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { DepartmentStatus, Order } from '../../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';
import { PurchaseBatchModal } from './PurchaseBatchModal';
import { OrderQuantityTracker } from '../OrderQuantityTracker';
import { ExportButton } from '../ui/ExportButton';
import { ExportDataPayload } from '../../utils/exportUtils';
import { SearchableDropdown } from '../ui/SearchableDropdown';

export const PurchaseDashboard: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { getMaskedOrders, addPurchaseBatch, setSelectedOrder, vendors } = useERP();
  const maskedOrders = getMaskedOrders().filter((o) => o.purchaseRequired);

  const [selectedVendorMap, setSelectedVendorMap] = useState<{ [key: string]: string }>({});
  const [notesMap, setNotesMap] = useState<{ [key: string]: string }>({});

  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedProcessOrder, setSelectedProcessOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  const filteredOrders = maskedOrders.filter((o) =>
    activeTab === 'PENDING' ? o.purchaseStatus !== 'COMPLETED' : o.purchaseStatus === 'COMPLETED'
  );

  const getPurchaseExportPayload = (): ExportDataPayload => {
    return {
      title: 'Purchase & Procurement Queue Report',
      filename: 'Purchase_Orders_Report',
      headers: ['Order No', 'PO Number', 'Material Spec', 'Required Qty', 'Procured Qty', 'Vendor Selected', 'Status'],
      rows: maskedOrders.map((o) => [
        o.orderNumber,
        o.poNumber,
        o.materialRequirements || 'SS316L Raw Bars',
        o.requiredQuantity,
        o.purchaseQuantity || 0,
        o.vendorSelected || 'Pending Sourcing',
        o.purchaseStatus,
      ]),
    };
  };

  const sampleVendors = vendors.length > 0
    ? vendors.filter((v) => v.status === 'ACTIVE').map((v) => v.vendorName)
    : ['Jindal Stainless Steel Works', 'Global Steel Supply Inc.', 'Bharat Forgings Vendor Unit A', 'Apex Alloys & Tubes Ltd'];

  const handleOpenProcessModal = (ord: Order) => {
    setSelectedProcessOrder(ord);
    setProcessModalVisible(true);
  };

  const handleAddBatch = async (data: { vendorName: string; quantityReceived: number; cost: number; remarks: string }) => {
    if (!selectedProcessOrder) return;
    try {
      await addPurchaseBatch(selectedProcessOrder.id, data);
      setProcessModalVisible(false);
      setSelectedProcessOrder(null);
    } catch (err: any) {
      console.error('Failed to add purchase batch:', err);
    }
  };

  const getStatusBadgeStyle = (status: DepartmentStatus, purQty: number = 0, reqQty: number = 50) => {
    if (purQty >= reqQty && reqQty > 0) {
      return { bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border, label: 'COMPLETED (100%)' };
    }
    if (purQty > 0) {
      return { bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border, label: `PARTIALLY RECEIVED (${purQty}/${reqQty})` };
    }
    return { bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border, label: 'PENDING' };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={isMobile ? { paddingBottom: 24 } : { paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={[styles.banner, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Purchase & Material Procurement Queue</Text>
          <Text style={styles.bannerSub}>
            Track raw material requirements, select vendors, and verify stock receipt with quantity tracking.
          </Text>
        </View>
        <ExportButton getData={getPurchaseExportPayload} buttonText="Export Purchase Data" />
      </View>

      {/* Row 1: Global Order KPI Cards */}
      <OrderKPICards style={{ marginBottom: Spacing.md }} />

      {/* Row 2: Global Task Metrics KPI Cards */}
      <TaskKPICards style={{ marginBottom: Spacing.lg }} />

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PENDING' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'PENDING' && styles.tabBtnTextActive]}>
            ⏳ Pending Purchase ({maskedOrders.filter((o) => o.purchaseStatus !== 'COMPLETED').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'COMPLETED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'COMPLETED' && styles.tabBtnTextActive]}>
            ✓ Purchase Completed ({maskedOrders.filter((o) => o.purchaseStatus === 'COMPLETED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Procurement Order Queue */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'PENDING' ? 'Pending Procurement Work Orders' : 'Completed Procurement Work Orders'}
        </Text>

        {filteredOrders.length === 0 ? (
          <Text style={styles.emptyText}>No {activeTab.toLowerCase()} purchase orders.</Text>
        ) : (
          filteredOrders.map((ord) => {
            const purQty = ord.purchaseQuantity || 0;
            const badgeStyle = getStatusBadgeStyle(ord.purchaseStatus, purQty, ord.requiredQuantity);

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

                {/* Dynamic Content based on Status */}
                {ord.purchaseStatus === 'COMPLETED' ? (
                  <View style={styles.purchaseReportCard}>
                    <Text style={styles.purchaseReportTitle}>✓ PURCHASE & SOURCING REPORT</Text>
                    {ord.purchaseBatches && ord.purchaseBatches.length > 0 ? (
                      <View>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: Colors.borderMuted || '#CBD5E1', paddingBottom: 6, marginBottom: 6 }}>
                          <Text style={[styles.purchaseReportLabel, { flex: 2 }]}>Vendor</Text>
                          <Text style={[styles.purchaseReportLabel, { flex: 1 }]}>Qty</Text>
                          <Text style={[styles.purchaseReportLabel, { flex: 1, textAlign: 'right' }]}>Cost</Text>
                        </View>
                        {ord.purchaseBatches.map(b => (
                          <View key={b.id} style={{ flexDirection: 'row', marginBottom: 4 }}>
                            <Text style={[styles.purchaseReportValue, { flex: 2, color: Colors.accentTeal || '#29585C' }]}>{b.vendorName}</Text>
                            <Text style={[styles.purchaseReportValue, { flex: 1 }]}>{b.quantityReceived}</Text>
                            <Text style={[styles.purchaseReportValue, { flex: 1, textAlign: 'right' }]}>{b.cost ? `₹${b.cost}` : '-'}</Text>
                          </View>
                        ))}
                        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: Colors.borderMuted || '#CBD5E1', paddingTop: 6, marginTop: 6 }}>
                          <Text style={[styles.purchaseReportLabel, { flex: 2 }]}>TOTAL:</Text>
                          <Text style={[styles.purchaseReportValueHighlight, { flex: 1 }]}>{ord.purchaseQuantity} / {ord.requiredQuantity} pcs</Text>
                          <Text style={[styles.purchaseReportValueHighlight, { flex: 1, textAlign: 'right', color: '#10b981' }]}>
                            ₹{ord.purchaseBatches.reduce((sum, b) => sum + (b.cost || 0), 0)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.purchaseReportRow}>
                          <Text style={styles.purchaseReportLabel}>Item / Material:</Text>
                          <Text style={styles.purchaseReportValue}>{ord.materialRequirements || 'Steel Billet'}</Text>
                        </View>
                        <View style={styles.purchaseReportRow}>
                          <Text style={styles.purchaseReportLabel}>Vendor / Supplier:</Text>
                          <Text style={styles.purchaseReportValueHighlight}>{ord.vendorSelected || 'None'}</Text>
                        </View>
                        <View style={styles.purchaseReportRow}>
                          <Text style={styles.purchaseReportLabel}>Procurement Notes:</Text>
                          <Text style={styles.purchaseReportValue}>{ord.procurementNotes || 'Material fully procured.'}</Text>
                        </View>
                        <View style={styles.purchaseReportRow}>
                          <Text style={styles.purchaseReportLabel}>Total Quantity Sourced:</Text>
                          <Text style={styles.purchaseReportValue}>{ord.purchaseQuantity || ord.requiredQuantity} / {ord.requiredQuantity} pcs</Text>
                        </View>
                      </>
                    )}
                  </View>
                  ) : (
                  <OrderQuantityTracker order={ord} style={{ marginTop: Spacing.xs }} />
                )}

                {/* Technical Spec & Raw Material Requirements */}
                <View style={styles.specBox}>
                  <Text style={styles.specTitle}>RAW MATERIAL & TECHNICAL REQUIREMENT</Text>
                  <Text style={styles.specVal}>Material: {ord.materialRequirements || 'Steel Billet'}</Text>
                  <Text style={styles.specVal}>Quantity Required: <Text style={styles.bold}>{ord.requiredQuantity} pcs</Text></Text>
                  <Text style={styles.specVal}>Material Received: <Text style={styles.bold}>{purQty} / {ord.requiredQuantity} pcs</Text></Text>
                  <Text style={styles.specVal}>Technical Specs: {ord.technicalRequirements || 'Standard Flange Spec'}</Text>
                </View>

                {/* Vendor Selection & Notes (Only if Pending) */}
                {ord.purchaseStatus !== 'COMPLETED' && (
                  <>
                    <View style={styles.vendorBox}>
                      <SearchableDropdown
                        label="Select Material Vendor / Supplier:"
                        placeholder="Search or select material vendor..."
                        options={sampleVendors.map((v) => ({
                          id: v,
                          label: v,
                          sublabel: 'Approved Material Supplier',
                          icon: '🏭',
                        }))}
                        selectedValue={selectedVendorMap[ord.id] || ord.vendorSelected || ''}
                        onSelect={(v) => setSelectedVendorMap({ ...selectedVendorMap, [ord.id]: v })}
                      />

                      <Text style={[styles.inputLabel, { marginTop: 10 }]}>Procurement Remarks / Delivery Notes:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter warehouse gate receipt number or MTC ref..."
                        placeholderTextColor="#94a3b8"
                        value={notesMap[ord.id] !== undefined ? notesMap[ord.id] : ord.procurementNotes || ''}
                        onChangeText={(txt) => setNotesMap({ ...notesMap, [ord.id]: txt })}
                      />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.btnProg, { flex: 1 }]}
                        onPress={() => handleOpenProcessModal(ord)}
                      >
                        <Text style={styles.actionBtnText}>📦 Record Material Received (Batch)</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Stage-Wise Quantity Process Modal */}
      <PurchaseBatchModal
          visible={processModalVisible}
          order={selectedProcessOrder}
          onClose={() => setProcessModalVisible(false)}
          onSubmit={handleAddBatch}
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
    backgroundColor: Colors.industrialOrange,
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
  vendorBox: {
    gap: Spacing.px6,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  vendorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.px6,
  },
  vendorChip: {
    backgroundColor: Colors.darkBlue,
    paddingHorizontal: Spacing.px10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  vendorChipActive: {
    backgroundColor: Colors.industrialOrange,
    borderColor: Colors.highlightOrange,
  },
  vendorChipText: {
    color: Colors.primaryLight,
    fontSize: 11,
  },
  vendorChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
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
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  btnProg: {
    backgroundColor: Colors.accentTeal,
  },
  btnDone: {
    backgroundColor: Colors.industrialOrange,
  },
  btnVerify: {
    backgroundColor: Colors.secondary,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.accentTeal,
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  purchaseReportCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  purchaseReportTitle: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  purchaseReportRow: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  purchaseReportLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    width: 150,
    fontWeight: '700',
  },
  purchaseReportValue: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  purchaseReportValueHighlight: {
      color: Colors.accentTeal || '#29585C', // Colors.accentTeal was too dark for the #0f172a background
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
});
