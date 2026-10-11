import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';
import { Order } from '../../types';
import { useERP } from '../../context/ERPContext';
import { SearchableDropdown } from '../ui/SearchableDropdown';

interface PurchaseBatchModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSubmit: (data: {
    vendorName: string;
    quantityOrdered: number;
    quantityReceived?: number;
    cost?: number;
    invoiceNumber?: string;
    receivingDate?: string;
    remarks?: string;
  }) => Promise<void>;
}

export const PurchaseBatchModal: React.FC<PurchaseBatchModalProps> = ({
  visible,
  order,
  onClose,
  onSubmit,
}) => {
  const [vendorName, setVendorName] = useState('');
  const [quantityOrdered, setQuantityOrdered] = useState('');
  const [cost, setCost] = useState('');
  const [remarks, setRemarks] = useState('');
  const [alreadyReceived, setAlreadyReceived] = useState(false);
  const [receivedQty, setReceivedQty] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { vendors } = useERP();

  // Initialize with remaining required quantity when modal opens
  useEffect(() => {
    if (visible && order) {
      setVendorName(order.vendorSelected || '');
      const existingOrdered = (order.purchaseBatches || []).reduce(
        (sum, b) => sum + (b.quantityOrdered || b.quantityReceived || 0),
        0
      );
      const remainingToOrder = Math.max(0, order.requiredQuantity - existingOrdered);
      setQuantityOrdered(remainingToOrder > 0 ? String(remainingToOrder) : String(order.requiredQuantity));
      setCost('');
      setRemarks('');
      setAlreadyReceived(false);
      setReceivedQty('');
      setInvoiceNumber('');
      setReceivingDate(new Date().toISOString().split('T')[0]);
      setErrorMsg('');
    }
  }, [visible, order]);

  if (!order) return null;

  const handleSubmit = async () => {
    setErrorMsg('');
    const qtyOrd = parseInt(quantityOrdered, 10);
    const costVal = parseFloat(cost) || 0;

    if (!vendorName.trim()) {
      setErrorMsg('Please select or enter a vendor name.');
      return;
    }
    if (isNaN(qtyOrd) || qtyOrd <= 0) {
      setErrorMsg('Please enter a valid quantity to order (greater than 0).');
      return;
    }

    let qtyRec = 0;
    if (alreadyReceived) {
      qtyRec = parseInt(receivedQty, 10);
      if (isNaN(qtyRec) || qtyRec <= 0) {
        setErrorMsg('Please enter a valid received quantity.');
        return;
      }
      if (!invoiceNumber.trim()) {
        setErrorMsg('Invoice number is required when recording receipt.');
        return;
      }
      if (!receivingDate.trim()) {
        setErrorMsg('Receiving date is required when recording receipt.');
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit({
        vendorName: vendorName.trim(),
        quantityOrdered: qtyOrd,
        quantityReceived: qtyRec,
        cost: costVal,
        invoiceNumber: alreadyReceived ? invoiceNumber.trim() : undefined,
        receivingDate: alreadyReceived ? receivingDate.trim() : undefined,
        remarks: remarks.trim(),
      });
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error creating purchase order batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>📦 Place Vendor Purchase Order</Text>
            <Text style={styles.subTitle}>
              Order: <Text style={styles.bold}>{order.orderNumber}</Text> • Total Required:{' '}
              <Text style={styles.bold}>{order.requiredQuantity} pcs</Text>
            </Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            <SearchableDropdown
              label="Vendor / Supplier Name *"
              placeholder="Search or select material vendor..."
              options={(vendors || []).map((v: any) => ({
                id: v.vendorName || v.id || v,
                label: v.vendorName || v.id || v,
              }))}
              selectedValue={vendorName}
              onSelect={(id) => setVendorName(id)}
            />

            <Text style={styles.label}>
              Quantity to Order with this Vendor (Pieces) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={quantityOrdered}
              onChangeText={setQuantityOrdered}
              keyboardType="numeric"
              placeholder="e.g. 50"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.helperText}>
              Example: 50 ek vendor ko, 50 dusre vendor ko split karke order kar sakte hain.
            </Text>

            <Text style={styles.label}>Estimated Cost / Total Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={cost}
              onChangeText={setCost}
              keyboardType="numeric"
              placeholder="e.g. 75000"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Procurement Notes / PO Remarks</Text>
            <TextInput
              style={styles.input}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="e.g. Delivery expected by Friday, Grade SS316L"
              placeholderTextColor="#94a3b8"
            />

            {/* Toggle: Already Received? */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setAlreadyReceived(!alreadyReceived)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, alreadyReceived && styles.checkboxActive]}>
                {alreadyReceived && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Material physically received right now?</Text>
                <Text style={styles.toggleSub}>
                  {alreadyReceived
                    ? 'Fill invoice and receiving details below.'
                    : 'Uncheck if order is placed and pending warehouse delivery.'}
                </Text>
              </View>
            </TouchableOpacity>

            {alreadyReceived && (
              <View style={styles.receivedSection}>
                <Text style={styles.label}>
                  Received Quantity (Pieces) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={receivedQty}
                  onChangeText={setReceivedQty}
                  keyboardType="numeric"
                  placeholder={`e.g. ${quantityOrdered || '50'}`}
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.label}>
                  Invoice / Bill Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={invoiceNumber}
                  onChangeText={setInvoiceNumber}
                  placeholder="e.g. INV-2026-901"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.label}>
                  Receiving Date (YYYY-MM-DD) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={receivingDate}
                  onChangeText={setReceivingDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            )}

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.submitText}>
                  {loading
                    ? 'Saving...'
                    : alreadyReceived
                    ? '✓ Place & Mark Received'
                    : '📦 Place Order (Pending Receive)'}
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
  bold: {
    fontWeight: '700',
    color: '#0f172a',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  receivedSection: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.md,
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
