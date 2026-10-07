import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';
import { Order } from '../../types';
import { useERP } from '../../context/ERPContext';
import { SearchableDropdown } from '../ui/SearchableDropdown';

interface PurchaseBatchModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSubmit: (data: { vendorName: string; quantityReceived: number; cost: number; remarks: string }) => Promise<void>;
}

export const PurchaseBatchModal: React.FC<PurchaseBatchModalProps> = ({ visible, order, onClose, onSubmit }) => {
  const [vendorName, setVendorName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const { vendors } = useERP();

  // Initialize with remaining quantity when modal opens
  React.useEffect(() => {
    if (visible && order) {
      setVendorName(order.vendorSelected || '');
      setQuantity(String(Math.max(0, order.requiredQuantity - (order.purchaseQuantity || 0))));
      setCost('');
      setRemarks('');
    }
  }, [visible, order]);

  if (!order) return null;

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    const costVal = parseFloat(cost) || 0;
    if (!vendorName || isNaN(qty) || qty <= 0) {
      alert('Please enter a valid vendor name and quantity.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ vendorName, quantityReceived: qty, cost: costVal, remarks });
      onClose();
    } catch (e: any) {
      alert(e.message || 'Error submitting batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Add Purchase Batch for {order.orderNumber}</Text>
          
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

          <Text style={styles.label}>Quantity Received <Text style={{color:'red'}}>*</Text></Text>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="e.g. 40" />

          <Text style={styles.label}>Total Price / Cost (₹)</Text>
          <TextInput style={styles.input} value={cost} onChangeText={setCost} keyboardType="numeric" placeholder="e.g. 5000" />

          <Text style={styles.label}>Procurement Notes</Text>
          <TextInput style={styles.input} value={remarks} onChangeText={setRemarks} placeholder="Any notes..." />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.submitText}>{loading ? 'Saving...' : 'Add Batch'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: 400, maxWidth: '90%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl },
  title: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg, color: Colors.textLight },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { borderWidth: 1, borderColor: Colors.borderMuted, borderRadius: Radius.md, padding: Spacing.md, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.xl, gap: Spacing.md },
  cancelBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  cancelText: { color: Colors.textMuted, fontWeight: '600' },
  submitBtn: { backgroundColor: Colors.success, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.md },
  submitText: { color: Colors.white, fontWeight: '700' },
});
