import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';
import { Order, PurchaseBatch } from '../../types';

interface ReceiveMaterialModalProps {
  visible: boolean;
  order: Order | null;
  batch: PurchaseBatch | null;
  onClose: () => void;
  onSubmit: (data: {
    receivedQuantity: number;
    invoiceNumber: string;
    receivingDate: string;
    remarks?: string;
  }) => Promise<void>;
}

export const ReceiveMaterialModal: React.FC<ReceiveMaterialModalProps> = ({
  visible,
  order,
  batch,
  onClose,
  onSubmit,
}) => {
  const [receivedQty, setReceivedQty] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible && batch) {
      const pending = Math.max(0, (batch.quantityOrdered || 0) - (batch.quantityReceived || 0));
      setReceivedQty(pending > 0 ? String(pending) : '0');
      setInvoiceNumber(batch.invoiceNumber || batch.invoiceRef || '');
      setReceivingDate(
        batch.receivingDate || batch.deliveryDate || new Date().toISOString().split('T')[0]
      );
      setRemarks('');
      setErrorMsg('');
    }
  }, [visible, batch]);

  if (!visible || !batch || !order) return null;

  const qtyOrdered = batch.quantityOrdered || 0;
  const alreadyReceived = batch.quantityReceived || 0;
  const pendingQty = Math.max(0, qtyOrdered - alreadyReceived);

  const handleSubmit = async () => {
    setErrorMsg('');
    const qty = parseInt(receivedQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid positive received quantity.');
      return;
    }
    if (pendingQty > 0 && qty > pendingQty) {
      setErrorMsg(
        `Received quantity (${qty} pcs) cannot exceed pending quantity (${pendingQty} pcs) for this vendor batch.`
      );
      return;
    }
    if (!invoiceNumber.trim()) {
      setErrorMsg('Invoice / Bill number is mandatory.');
      return;
    }
    if (!receivingDate.trim()) {
      setErrorMsg('Receiving date is mandatory.');
      return;
    }

    // New total quantity received for this batch
    const newTotalReceived = alreadyReceived + qty;
    if (qtyOrdered > 0 && newTotalReceived > qtyOrdered) {
      setErrorMsg(`Total received cannot exceed ordered quantity of ${qtyOrdered} pcs.`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        receivedQuantity: newTotalReceived,
        invoiceNumber: invoiceNumber.trim(),
        receivingDate: receivingDate.trim(),
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to record material receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>📥 Receive Material - Warehouse Receipt</Text>
            <Text style={styles.subTitle}>
              Order: <Text style={styles.highlightText}>{order.orderNumber}</Text> • Vendor:{' '}
              <Text style={styles.highlightText}>{batch.vendorName}</Text>
            </Text>

            {/* Batch Status Summary Box */}
            <View style={styles.statsCard}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Ordered Qty</Text>
                <Text style={styles.statVal}>{qtyOrdered} pcs</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Already Recv</Text>
                <Text style={[styles.statVal, { color: '#10b981' }]}>{alreadyReceived} pcs</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={[styles.statVal, { color: '#f59e0b' }]}>{pendingQty} pcs</Text>
              </View>
            </View>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {/* Input 1: Received Quantity */}
            <Text style={styles.label}>
              1. Received Quantity (Pieces) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={receivedQty}
              onChangeText={setReceivedQty}
              keyboardType="numeric"
              placeholder={`e.g. ${pendingQty}`}
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.helperText}>
              Kitna maal physical deliver hua (partial ya complete delivery).
            </Text>

            {/* Input 2: Invoice / Bill Number */}
            <Text style={styles.label}>
              2. Invoice / Bill Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="e.g. INV-2026-0045 / GST-8891"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.helperText}>Supplier ka tax invoice / challan number.</Text>

            {/* Input 3: Receiving Date */}
            <Text style={styles.label}>
              3. Receiving Date (YYYY-MM-DD) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={receivingDate}
              onChangeText={setReceivingDate}
              placeholder="YYYY-MM-DD (e.g. 2026-10-15)"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.helperText}>
              Kis date ko maal factory / store warehouse mein physically deliver hua.
            </Text>

            {/* Optional Remarks */}
            <Text style={styles.label}>Inspection / Store Receipt Remarks (Optional)</Text>
            <TextInput
              style={styles.input}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="e.g. Quality inspection passed, heat certificate verified"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.submitText}>
                  {loading ? 'Recording...' : '✓ Confirm Receipt & Update Stock'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContainer: {
    width: 480,
    maxWidth: '96%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: Spacing.md,
  },
  highlightText: {
    fontWeight: '700',
    color: Colors.accentTeal || '#0284c7',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  required: {
    color: '#ef4444',
  },
  helperText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
