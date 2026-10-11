import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { DepartmentStatus, Order, PurchaseBatch } from '../../types';
import { Colors, StatusColors, Spacing, Radius } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';
import { PurchaseBatchModal } from './PurchaseBatchModal';
import { ReceiveMaterialModal } from './ReceiveMaterialModal';
import { OrderQuantityTracker } from '../OrderQuantityTracker';
import { ExportButton } from '../ui/ExportButton';
import { ExportDataPayload } from '../../utils/exportUtils';

export const PurchaseDashboard: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { getMaskedOrders, addPurchaseBatch, receivePurchaseBatch, setSelectedOrder } = useERP();
  const maskedOrders = getMaskedOrders().filter((o) => o.purchaseRequired);

  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedProcessOrder, setSelectedProcessOrder] = useState<Order | null>(null);

  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [selectedReceiveOrder, setSelectedReceiveOrder] = useState<Order | null>(null);
  const [selectedReceiveBatch, setSelectedReceiveBatch] = useState<PurchaseBatch | null>(null);

  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  const filteredOrders = maskedOrders.filter((o) =>
    activeTab === 'PENDING' ? o.purchaseStatus !== 'COMPLETED' : o.purchaseStatus === 'COMPLETED'
  );

  const getPurchaseExportPayload = (): ExportDataPayload => {
    const headers = [
      'Order No',
      'PO Number',
      'Material Spec',
      'Order Required Qty',
      'Vendor Name',
      'Qty Ordered with Vendor',
      'Qty Received',
      'Pending Qty',
      'Receiving Date',
      'Invoice / Bill Number',
      'Batch Status',
      'Overall Purchase Status',
      'Remarks',
    ];

    const rows: (string | number)[][] = [];

    maskedOrders.forEach((o) => {
      if (o.purchaseBatches && o.purchaseBatches.length > 0) {
        o.purchaseBatches.forEach((b: any) => {
          const qtyOrdered = b.quantityOrdered || b.quantityReceived || 0;
          const qtyReceived = b.quantityReceived || 0;
          const pending = Math.max(0, qtyOrdered - qtyReceived);
          rows.push([
            o.orderNumber,
            o.poNumber || 'N/A',
            o.materialRequirements || 'Standard Spec',
            o.requiredQuantity,
            b.vendorName || 'N/A',
            qtyOrdered,
            qtyReceived,
            pending,
            b.receivingDate || b.deliveryDate || 'N/A',
            b.invoiceNumber || b.invoiceRef || 'N/A',
            b.status === 'FULLY_RECEIVED'
              ? 'Fully Received'
              : qtyReceived > 0
              ? 'Partially Received'
              : 'Order Placed (Pending Receive)',
            o.purchaseStatus === 'COMPLETED'
              ? 'Purchase Done'
              : qtyReceived > 0
              ? 'Partially Received'
              : 'Order Placed / Pending Receive',
            b.remarks || '',
          ]);
        });
      } else {
        rows.push([
          o.orderNumber,
          o.poNumber || 'N/A',
          o.materialRequirements || 'Standard Spec',
          o.requiredQuantity,
          o.vendorSelected || 'Pending Sourcing',
          0,
          o.purchaseQuantity || 0,
          Math.max(0, o.requiredQuantity - (o.purchaseQuantity || 0)),
          'N/A',
          'N/A',
          'Pending Order Placement',
          o.purchaseStatus || 'PENDING',
          o.procurementNotes || '',
        ]);
      }
    });

    return {
      title: 'Purchase & Vendor Procurement Detailed Breakup Report',
      filename: 'Purchase_Detailed_Procurement_Report',
      headers,
      rows,
    };
  };

  const handleOpenProcessModal = (ord: Order) => {
    setSelectedProcessOrder(ord);
    setProcessModalVisible(true);
  };

  const handleOpenReceiveModal = (ord: Order, batch: PurchaseBatch) => {
    setSelectedReceiveOrder(ord);
    setSelectedReceiveBatch(batch);
    setReceiveModalVisible(true);
  };

  const handleAddBatch = async (data: {
    vendorName: string;
    quantityOrdered: number;
    quantityReceived?: number;
    cost?: number;
    invoiceNumber?: string;
    receivingDate?: string;
    remarks?: string;
  }) => {
    if (!selectedProcessOrder) return;
    try {
      await addPurchaseBatch(selectedProcessOrder.id, data as any);
      setProcessModalVisible(false);
      setSelectedProcessOrder(null);
    } catch (err: any) {
      console.error('Failed to add purchase batch:', err);
      alert(err.message || 'Failed to place purchase batch order');
    }
  };

  const handleReceiveBatch = async (data: {
    receivedQuantity: number;
    invoiceNumber: string;
    receivingDate: string;
    remarks?: string;
  }) => {
    if (!selectedReceiveOrder || !selectedReceiveBatch) return;
    try {
      await receivePurchaseBatch(selectedReceiveOrder.id, selectedReceiveBatch.id, data);
      setReceiveModalVisible(false);
      setSelectedReceiveOrder(null);
      setSelectedReceiveBatch(null);
    } catch (err: any) {
      console.error('Failed to receive batch:', err);
      alert(err.message || 'Failed to record material receipt');
    }
  };

  const getStatusBadgeStyle = (ord: Order) => {
    const purQty = ord.purchaseQuantity || 0;
    const reqQty = ord.requiredQuantity || 1;
    const batches = ord.purchaseBatches || [];
    const hasBatches = batches.length > 0;
    const allFullyReceived =
      hasBatches &&
      batches.every((b) => (b.quantityReceived || 0) >= (b.quantityOrdered || b.quantityReceived || 0));

    if (ord.purchaseStatus === 'COMPLETED' || (purQty >= reqQty && reqQty > 0 && allFullyReceived)) {
      return {
        bg: StatusColors.COMPLETED.bg,
        text: StatusColors.COMPLETED.text,
        border: StatusColors.COMPLETED.border,
        label: '✓ PURCHASE DONE (100%)',
      };
    }
    if (purQty > 0) {
      return {
        bg: StatusColors.IN_PROGRESS.bg,
        text: StatusColors.IN_PROGRESS.text,
        border: StatusColors.IN_PROGRESS.border,
        label: `PARTIALLY RECEIVED (${purQty}/${reqQty} PCS)`,
      };
    }
    if (hasBatches) {
      return {
        bg: 'rgba(2, 132, 199, 0.15)',
        text: '#0284c7',
        border: '#0284c7',
        label: `ORDER PLACED / PENDING RECEIVE (0/${reqQty} PCS)`,
      };
    }
    return {
      bg: StatusColors.PENDING.bg,
      text: StatusColors.PENDING.text,
      border: StatusColors.PENDING.border,
      label: 'PENDING SOURCING',
    };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={isMobile ? { paddingBottom: 24 } : { paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Banner */}
      <View
        style={[
          styles.banner,
          isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Purchase & Material Procurement Queue</Text>
          <Text style={styles.bannerSub}>
            Split orders across vendors, track Order Placed / Pending Receive status, and confirm physical warehouse receipt.
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
            ⏳ Pending / In-Progress Purchase ({maskedOrders.filter((o) => o.purchaseStatus !== 'COMPLETED').length})
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
          {activeTab === 'PENDING'
            ? 'Active Procurement Orders & Delivery Tracking'
            : 'Completed Procurement Work Orders'}
        </Text>

        {filteredOrders.length === 0 ? (
          <Text style={styles.emptyText}>No {activeTab.toLowerCase()} purchase orders found.</Text>
        ) : (
          filteredOrders.map((ord) => {
            const purQty = ord.purchaseQuantity || 0;
            const badgeStyle = getStatusBadgeStyle(ord);
            const batches = ord.purchaseBatches || [];
            const totalOrdered = batches.reduce(
              (sum, b) => sum + (b.quantityOrdered || b.quantityReceived || 0),
              0
            );

            return (
              <View
                key={ord.id}
                style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: badgeStyle.bg }]}
              >
                <View style={styles.cardHeader}>
                  <TouchableOpacity onPress={() => setSelectedOrder(ord)}>
                    <View style={styles.orderRefRow}>
                      <Text style={styles.orderNum}>{ord.orderNumber}</Text>
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>Client Code: {ord.clientCode}</Text>
                      </View>
                    </View>
                    <Text style={styles.poNumberText}>PO Ref: {ord.poNumber || 'N/A'}</Text>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: badgeStyle.bg,
                        borderWidth: 1,
                        borderColor: badgeStyle.border,
                      },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                      {badgeStyle.label}
                    </Text>
                  </View>
                </View>

                {/* Live Quantity Tracking Bar */}
                <OrderQuantityTracker order={ord} style={{ marginTop: Spacing.xs }} />

                {/* Technical Spec & Raw Material Requirements */}
                <View style={styles.specBox}>
                  <Text style={styles.specTitle}>RAW MATERIAL & TECHNICAL REQUIREMENT</Text>
                  <Text style={styles.specVal}>
                    Material: <Text style={styles.bold}>{ord.materialRequirements || 'Steel Billet / Raw Bars'}</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                    <Text style={styles.specVal}>
                      Order Required:{' '}
                      <Text style={[styles.bold, { color: '#38bdf8' }]}>{ord.requiredQuantity} pcs</Text>
                    </Text>
                    <Text style={styles.specVal}>
                      Vendor Ordered:{' '}
                      <Text style={[styles.bold, { color: '#f59e0b' }]}>{totalOrdered} pcs</Text>
                    </Text>
                    <Text style={styles.specVal}>
                      Received at Store:{' '}
                      <Text style={[styles.bold, { color: '#10b981' }]}>{purQty} pcs</Text>
                    </Text>
                  </View>
                  {ord.technicalRequirements ? (
                    <Text style={[styles.specVal, { marginTop: 4 }]}>
                      Technical Specs: {ord.technicalRequirements}
                    </Text>
                  ) : null}
                </View>

                {/* VENDOR BREAKDOWN & MATERIAL RECEIVING SECTION */}
                <View style={styles.batchesSection}>
                  <View style={styles.batchesSectionHeader}>
                    <Text style={styles.batchesSectionTitle}>
                      📋 VENDOR PURCHASE ORDERS & RECEIVING STATUS ({batches.length})
                    </Text>
                    <TouchableOpacity
                      style={styles.addBatchSmallBtn}
                      onPress={() => handleOpenProcessModal(ord)}
                    >
                      <Text style={styles.addBatchSmallBtnText}>+ Place Vendor Order</Text>
                    </TouchableOpacity>
                  </View>

                  {batches.length === 0 ? (
                    <View style={styles.noBatchesBox}>
                      <Text style={styles.noBatchesText}>
                        No purchase orders placed with vendors yet. Click "+ Place Vendor Order" to assign quantity to a vendor.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.batchesList}>
                      {batches.map((b) => {
                        const bOrdered = b.quantityOrdered || b.quantityReceived || 0;
                        const bReceived = b.quantityReceived || 0;
                        const bPending = Math.max(0, bOrdered - bReceived);
                        const isFullyReceived = bReceived >= bOrdered && bOrdered > 0;
                        const isPartiallyReceived = bReceived > 0 && !isFullyReceived;

                        let batchStatusLabel = 'Order Placed (Pending Receive)';
                        let batchStatusColor = '#0284c7';
                        let batchStatusBg = 'rgba(2, 132, 199, 0.15)';

                        if (isFullyReceived) {
                          batchStatusLabel = '✓ Fully Received';
                          batchStatusColor = '#10b981';
                          batchStatusBg = 'rgba(16, 185, 129, 0.15)';
                        } else if (isPartiallyReceived) {
                          batchStatusLabel = `Partially Received (${bReceived}/${bOrdered})`;
                          batchStatusColor = '#f59e0b';
                          batchStatusBg = 'rgba(245, 158, 11, 0.15)';
                        }

                        return (
                          <View key={b.id} style={styles.batchRowCard}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Text style={styles.batchVendorName}>🏭 {b.vendorName}</Text>
                                <View
                                  style={[
                                    styles.batchStatusChip,
                                    { backgroundColor: batchStatusBg, borderColor: batchStatusColor },
                                  ]}
                                >
                                  <Text style={[styles.batchStatusChipText, { color: batchStatusColor }]}>
                                    {batchStatusLabel}
                                  </Text>
                                </View>
                              </View>

                              {/* Quantity breakdown */}
                              <View style={styles.batchQtyRow}>
                                <Text style={styles.batchQtyItem}>
                                  Ordered: <Text style={styles.batchQtyBold}>{bOrdered} pcs</Text>
                                </Text>
                                <Text style={styles.batchQtyItem}>
                                  Received: <Text style={[styles.batchQtyBold, { color: '#10b981' }]}>{bReceived} pcs</Text>
                                </Text>
                                <Text style={styles.batchQtyItem}>
                                  Pending: <Text style={[styles.batchQtyBold, { color: '#f59e0b' }]}>{bPending} pcs</Text>
                                </Text>
                                {b.cost ? (
                                  <Text style={styles.batchQtyItem}>
                                    Cost: <Text style={styles.batchQtyBold}>₹{b.cost}</Text>
                                  </Text>
                                ) : null}
                              </View>

                              {/* Delivery & Invoice Details */}
                              <View style={styles.batchMetaRow}>
                                {b.invoiceNumber || b.invoiceRef ? (
                                  <Text style={styles.batchMetaText}>
                                    📄 Invoice: <Text style={styles.batchMetaVal}>{b.invoiceNumber || b.invoiceRef}</Text>
                                  </Text>
                                ) : (
                                  <Text style={styles.batchMetaPending}>📄 Invoice: Pending Delivery</Text>
                                )}
                                {b.receivingDate || b.deliveryDate ? (
                                  <Text style={styles.batchMetaText}>
                                    📅 Recv Date: <Text style={styles.batchMetaVal}>{b.receivingDate || b.deliveryDate}</Text>
                                  </Text>
                                ) : null}
                                {b.remarks ? (
                                  <Text style={styles.batchMetaText}>
                                    📝 Notes: <Text style={styles.batchMetaVal}>{b.remarks}</Text>
                                  </Text>
                                ) : null}
                              </View>
                            </View>

                            {/* Action: Receive Button */}
                            <View style={styles.batchActionCol}>
                              {!isFullyReceived ? (
                                <TouchableOpacity
                                  style={styles.receiveBtn}
                                  onPress={() => handleOpenReceiveModal(ord, b)}
                                >
                                  <Text style={styles.receiveBtnText}>📥 Receive</Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={styles.receivedBadge}>
                                  <Text style={styles.receivedBadgeText}>✓ Received</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Place Vendor Order Modal */}
      <PurchaseBatchModal
        visible={processModalVisible}
        order={selectedProcessOrder}
        onClose={() => setProcessModalVisible(false)}
        onSubmit={handleAddBatch}
      />

      {/* Receive Material Modal (3 Inputs: Received Qty, Invoice No, Receiving Date) */}
      <ReceiveMaterialModal
        visible={receiveModalVisible}
        order={selectedReceiveOrder}
        batch={selectedReceiveBatch}
        onClose={() => setReceiveModalVisible(false)}
        onSubmit={handleReceiveBatch}
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
    fontWeight: '700',
  },
  poNumberText: {
    color: Colors.primaryLight,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.xs,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  specBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  specTitle: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  specVal: {
    color: Colors.textLight,
    fontSize: 12,
  },
  bold: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  batchesSection: {
    backgroundColor: '#0a192f',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
  },
  batchesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
    gap: 8,
  },
  batchesSectionTitle: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addBatchSmallBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  addBatchSmallBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  noBatchesBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  noBatchesText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  batchesList: {
    gap: Spacing.sm,
  },
  batchRowCard: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  batchVendorName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  batchStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  batchStatusChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  batchQtyRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  batchQtyItem: {
    color: '#94a3b8',
    fontSize: 11,
  },
  batchQtyBold: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  batchMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  batchMetaText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  batchMetaPending: {
    color: '#f59e0b',
    fontSize: 11,
    fontStyle: 'italic',
  },
  batchMetaVal: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  batchActionCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 90,
  },
  receiveBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#059669',
  },
  receiveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  receivedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  receivedBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
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
});
