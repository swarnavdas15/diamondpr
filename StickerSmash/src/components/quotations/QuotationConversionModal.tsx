import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Quotation } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

export interface QuotationConversionData {
  approvedAmount: number;
  finalRemarks: string;
  expectedDeliveryDate?: string;
  qualityTestingRequired: boolean;
  purchaseRequired: boolean;
  productionRequired: boolean;
  dispatchRequired: boolean;
}

interface QuotationConversionModalProps {
  visible: boolean;
  quotation: Quotation | null;
  onClose: () => void;
  onSubmitConversion: (data: QuotationConversionData) => void;
}

export const QuotationConversionModal: React.FC<QuotationConversionModalProps> = ({
  visible,
  quotation,
  onClose,
  onSubmitConversion,
}) => {
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [finalRemarks, setFinalRemarks] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [qualityTestingRequired, setQualityTestingRequired] = useState<boolean>(true);
  const [purchaseRequired, setPurchaseRequired] = useState<boolean>(true);
  const [productionRequired, setProductionRequired] = useState<boolean>(true);
  const [dispatchRequired, setDispatchRequired] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (quotation) {
      setApprovedAmount(String(quotation.quotationAmount));
      setFinalRemarks(quotation.remarks || '');
    }
  }, [quotation]);

  if (!quotation) return null;

  const handleSubmit = () => {
    setError('');
    const amtNum = Number(approvedAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setError('Please enter a valid Approved Amount.');
      return;
    }

    onSubmitConversion({
      approvedAmount: amtNum,
      finalRemarks: finalRemarks.trim(),
      expectedDeliveryDate: expectedDeliveryDate.trim() || undefined,
      qualityTestingRequired,
      purchaseRequired,
      productionRequired,
      dispatchRequired,
    });
    handleClose();
  };

  const handleClose = () => {
    setApprovedAmount('');
    setFinalRemarks('');
    setExpectedDeliveryDate('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Quotation Conversion & Order Initiation</Text>
              <Text style={styles.subTitle}>
                {quotation.quotationNumber} • {quotation.companyName} ({quotation.clientCode})
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Approved Order Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1000000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={approvedAmount}
                onChangeText={setApprovedAmount}
              />

              <Text style={styles.label}>Expected Delivery Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={expectedDeliveryDate}
                onChangeText={setExpectedDeliveryDate}
              />

              <Text style={styles.label}>Configure Department Pipeline Requirements</Text>
              <View style={styles.pipelineGrid}>
                <TouchableOpacity
                  style={[styles.pipeChip, purchaseRequired && styles.pipeChipActive]}
                  onPress={() => setPurchaseRequired(!purchaseRequired)}
                >
                  <Text style={[styles.pipeChipText, purchaseRequired && styles.pipeChipTextActive]}>
                    🛒 Purchase {purchaseRequired ? '✓' : '✕'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pipeChip, productionRequired && styles.pipeChipActive]}
                  onPress={() => setProductionRequired(!productionRequired)}
                >
                  <Text style={[styles.pipeChipText, productionRequired && styles.pipeChipTextActive]}>
                    🏭 Production {productionRequired ? '✓' : '✕'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pipeChip, qualityTestingRequired && styles.pipeChipActive]}
                  onPress={() => setQualityTestingRequired(!qualityTestingRequired)}
                >
                  <Text style={[styles.pipeChipText, qualityTestingRequired && styles.pipeChipTextActive]}>
                    🔍 Quality Testing {qualityTestingRequired ? '✓' : '✕'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pipeChip, dispatchRequired && styles.pipeChipActive]}
                  onPress={() => setDispatchRequired(!dispatchRequired)}
                >
                  <Text style={[styles.pipeChipText, dispatchRequired && styles.pipeChipTextActive]}>
                    📦 Dispatch {dispatchRequired ? '✓' : '✕'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Final Remarks & Commercial Notes</Text>
              <TextInput
                style={[styles.input, { height: 65, textAlignVertical: 'top' }]}
                placeholder="Enter order terms, delivery instructions, or drawing approval references..."
                placeholderTextColor="#94a3b8"
                multiline
                value={finalRemarks}
                onChangeText={setFinalRemarks}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>
                  🚀 Approve Quotation & Proceed to Create Order
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 560,
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
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  closeText: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: Colors.industrialOrange,
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    fontSize: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
  },
  formScroll: {
    maxHeight: 420,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  label: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  pipelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginVertical: 4,
  },
  pipeChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  pipeChipActive: {
    backgroundColor: Colors.successBright,
    borderColor: Colors.successBright,
  },
  pipeChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  pipeChipTextActive: {
    color: Colors.white,
  },
  submitBtn: {
    backgroundColor: Colors.successBright,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
