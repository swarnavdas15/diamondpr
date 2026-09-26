import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { DepartmentStatus, Order } from '../../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';
import { QuantityProcessModal } from '../QuantityProcessModal';
import { OrderQuantityTracker } from '../OrderQuantityTracker';

export const PurchaseDashboard: React.FC = () => {
  const { getMaskedOrders, updatePurchaseStage, setSelectedOrder } = useERP();
  const maskedOrders = getMaskedOrders().filter((o) => o.purchaseRequired);

  const [selectedVendorMap, setSelectedVendorMap] = useState<{ [key: string]: string }>({});
  const [notesMap, setNotesMap] = useState<{ [key: string]: string }>({});

  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedProcessOrder, setSelectedProcessOrder] = useState<Order | null>(null);

  const sampleVendors = [
    'Jindal Stainless Steel Works',
    'Global Steel Supply Inc.',
    'Bharat Forgings Vendor Unit A',
    'Apex Alloys & Tubes Ltd',
  ];

  const handleOpenProcessModal = (ord: Order) => {
    setSelectedProcessOrder(ord);
    setProcessModalVisible(true);
  };

  const handleProcessSubmit = (data: { processedQty: number; remarks?: string; vendorSelected?: string }) => {
    if (!selectedProcessOrder) return;
    const vendor = data.vendorSelected || selectedVendorMap[selectedProcessOrder.id] || 'Jindal Stainless Steel Works';
    const notes = data.remarks || notesMap[selectedProcessOrder.id] || 'Material procured and verified in stock.';
    const newQty = (selectedProcessOrder.purchaseQuantity || 0) + data.processedQty;
    const calcStatus: DepartmentStatus = newQty >= selectedProcessOrder.requiredQuantity ? 'COMPLETED' : 'IN_PROGRESS';

    updatePurchaseStage(selectedProcessOrder.id, calcStatus, vendor, notes, data.processedQty);
    setProcessModalVisible(false);
    setSelectedProcessOrder(null);
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Purchase & Material Procurement Queue</Text>
          <Text style={styles.bannerSub}>
            Track raw material requirements, select vendors, and verify stock receipt with quantity tracking.
          </Text>
        </View>
      </View>

      {/* Row 1: Global Order KPI Cards */}
      <OrderKPICards style={{ marginBottom: Spacing.md }} />

      {/* Row 2: Global Task Metrics KPI Cards */}
      <TaskKPICards style={{ marginBottom: Spacing.lg }} />

      {/* Procurement Order Queue */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Procurement Work Orders</Text>

        {maskedOrders.length === 0 ? (
          <Text style={styles.emptyText}>No pending purchase orders required.</Text>
        ) : (
          maskedOrders.map((ord) => {
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

                {/* Embedded Live Quantity Tracker */}
                <OrderQuantityTracker order={ord} style={{ marginTop: Spacing.xs }} />

                {/* Technical Spec & Raw Material Requirements */}
                <View style={styles.specBox}>
                  <Text style={styles.specTitle}>RAW MATERIAL & TECHNICAL REQUIREMENT</Text>
                  <Text style={styles.specVal}>Material: {ord.materialRequirements || 'Steel Billet'}</Text>
                  <Text style={styles.specVal}>Quantity Required: <Text style={styles.bold}>{ord.requiredQuantity} pcs</Text></Text>
                  <Text style={styles.specVal}>Material Received: <Text style={styles.bold}>{purQty} / {ord.requiredQuantity} pcs</Text></Text>
                  <Text style={styles.specVal}>Technical Specs: {ord.technicalRequirements || 'Standard Flange Spec'}</Text>
                </View>

                {/* Vendor Selection & Notes */}
                <View style={styles.vendorBox}>
                  <Text style={styles.inputLabel}>Select Material Vendor / Supplier:</Text>
                  <View style={styles.vendorChips}>
                    {sampleVendors.map((v) => {
                      const isSel = (selectedVendorMap[ord.id] || ord.vendorSelected) === v;
                      return (
                        <TouchableOpacity
                          key={v}
                          style={[styles.vendorChip, isSel && styles.vendorChipActive]}
                          onPress={() => setSelectedVendorMap({ ...selectedVendorMap, [ord.id]: v })}
                        >
                          <Text style={[styles.vendorChipText, isSel && styles.vendorChipTextActive]}>{v}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.inputLabel}>Procurement Remarks / Delivery Notes:</Text>
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
                    style={[styles.actionBtn, styles.btnProg]}
                    onPress={() => handleOpenProcessModal(ord)}
                  >
                    <Text style={styles.actionBtnText}>📦 Record Material Received (Batch)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnDone]}
                    onPress={() => handleOpenProcessModal(ord)}
                  >
                    <Text style={styles.actionBtnText}>✓ Purchase Done</Text>
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
        stage="PURCHASE"
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
});
