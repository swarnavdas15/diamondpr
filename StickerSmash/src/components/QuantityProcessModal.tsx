import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Order, QCResult } from '../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../theme';

interface QuantityProcessModalProps {
  visible: boolean;
  order: Order | null;
  stage: 'PURCHASE' | 'PRODUCTION' | 'QUALITY_TESTING' | 'DISPATCH';
  onClose: () => void;
  onSubmit: (data: {
    processedQty: number;
    remarks?: string;
    vendorSelected?: string;
    qcResult?: QCResult;
    transportRef?: string;
    logisticsEntry?: string;
  }) => void;
}

export const QuantityProcessModal: React.FC<QuantityProcessModalProps> = ({
  visible,
  order,
  stage,
  onClose,
  onSubmit,
}) => {
  const [inputQty, setInputQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [vendorSelected, setVendorSelected] = useState('');
  const [qcResult, setQcResult] = useState<QCResult>('PASSED');
  const [transportRef, setTransportRef] = useState('');
  const [logisticsEntry, setLogisticsEntry] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const sampleVendors = [
    'Jindal Stainless Steel Works',
    'Global Steel Supply Inc.',
    'Bharat Forgings Vendor Unit A',
    'Apex Alloys & Tubes Ltd',
  ];

  useEffect(() => {
    if (order) {
      setInputQty('');
      setRemarks('');
      setVendorSelected(order.vendorSelected || 'Jindal Stainless Steel Works');
      setQcResult('PASSED');
      setTransportRef('TRP-10-TON-CONTAINER-4491');
      setLogisticsEntry('VRL Logistics Container Truck #MH-12-AB-9876');
      setErrorMsg('');
    }
  }, [order, stage, visible]);

  if (!visible || !order) return null;

  const totalQty = order.requiredQuantity || 1;

  // Determine stage specifics
  let stageTitle = '';
  let questionPrompt = '';
  let alreadyProcessed = 0;
  let maxAvailable = 0;

  if (stage === 'PURCHASE') {
    stageTitle = 'Purchase & Material Receipt Progress';
    questionPrompt = 'How many items/material units have been received?';
    alreadyProcessed = order.purchaseQuantity || 0;
    maxAvailable = Math.max(0, totalQty - alreadyProcessed);
  } else if (stage === 'PRODUCTION') {
    stageTitle = 'Production & Manufacturing Output Update';
    questionPrompt = 'How many finished items have been produced?';
    alreadyProcessed = order.productionQuantity || 0;
    maxAvailable = Math.max(0, totalQty - alreadyProcessed);
  } else if (stage === 'QUALITY_TESTING') {
    stageTitle = 'Quality Testing & Inspection Result Log';
    questionPrompt = 'How many produced items have been quality inspected?';
    alreadyProcessed = order.qcQuantity || 0;
    const producedAvailable = order.productionQuantity || 0;
    maxAvailable = Math.max(0, producedAvailable - alreadyProcessed);
  } else if (stage === 'DISPATCH') {
    stageTitle = 'Dispatch & Logistics Shipment Process';
    questionPrompt = 'How many items are being dispatched in this shipment?';
    alreadyProcessed = order.dispatchQuantity || 0;
    const passedQc = order.qualityTestingRequired ? (order.qcQuantity || 0) : (order.productionQuantity || 0);
    maxAvailable = Math.max(0, passedQc - alreadyProcessed);
  }

  const remainingQty = Math.max(0, maxAvailable);

  const handleSubmit = () => {
    setErrorMsg('');
    const val = Number(inputQty);

    if (!inputQty.trim() || isNaN(val) || val <= 0) {
      setErrorMsg('Please enter a valid quantity greater than 0.');
      return;
    }
    if (val > maxAvailable) {
      setErrorMsg(`Quantity cannot exceed remaining quantity available for this stage (${maxAvailable} PCS).`);
      return;
    }
    if (alreadyProcessed + val > totalQty) {
      setErrorMsg(`Total processed quantity cannot exceed total order quantity (${totalQty} PCS).`);
      return;
    }

    onSubmit({
      processedQty: val,
      remarks: remarks.trim() || undefined,
      vendorSelected: stage === 'PURCHASE' ? vendorSelected : undefined,
      qcResult: stage === 'QUALITY_TESTING' ? qcResult : undefined,
      transportRef: stage === 'DISPATCH' ? transportRef : undefined,
      logisticsEntry: stage === 'DISPATCH' ? logisticsEntry : undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{stageTitle}</Text>
              <Text style={styles.headerSub}>Order: {order.orderNumber} • {order.clientCode}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 480 }}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {/* Quantity Metrics Card */}
            <View style={styles.metricsCard}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{totalQty} PCS</Text>
                <Text style={styles.metricLbl}>Total Order Qty</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: Colors.accentTeal }]}>{alreadyProcessed} PCS</Text>
                <Text style={styles.metricLbl}>Already Processed</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: maxAvailable > 0 ? Colors.industrialOrange : Colors.textSubtle }]}>
                  {remainingQty} PCS
                </Text>
                <Text style={styles.metricLbl}>Remaining Qty</Text>
              </View>
            </View>

            {/* Question Prompt */}
            <Text style={styles.promptText}>{questionPrompt}</Text>

            {/* Input Field: Quantity to Process */}
            <Text style={styles.inputLabel}>Quantity to Process (PCS) *</Text>
            <TextInput
              style={[styles.input, { fontSize: 16, fontWeight: '800', color: Colors.accentTeal }]}
              placeholder={`Enter quantity (Max: ${maxAvailable} PCS)`}
              placeholderTextColor="#94a3b8"
              value={inputQty}
              onChangeText={setInputQty}
              keyboardType="numeric"
              autoFocus
            />

            {/* Stage-Specific Fields */}
            {stage === 'PURCHASE' && (
              <View style={{ marginTop: Spacing.sm }}>
                <Text style={styles.inputLabel}>Material Vendor / Supplier:</Text>
                <View style={styles.vendorChips}>
                  {sampleVendors.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.chip, vendorSelected === v && styles.chipActive]}
                      onPress={() => setVendorSelected(v)}
                    >
                      <Text style={[styles.chipText, vendorSelected === v && styles.chipTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {stage === 'QUALITY_TESTING' && (
              <View style={{ marginTop: Spacing.sm }}>
                <Text style={styles.inputLabel}>Quality Inspection Result *</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <TouchableOpacity
                    style={[styles.qcBtn, qcResult === 'PASSED' && styles.qcBtnPassed]}
                    onPress={() => setQcResult('PASSED')}
                  >
                    <Text style={[styles.qcBtnText, qcResult === 'PASSED' && styles.qcBtnTextPassed]}>✓ QC PASSED</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.qcBtn, qcResult === 'FAILED' && styles.qcBtnFailed]}
                    onPress={() => setQcResult('FAILED')}
                  >
                    <Text style={[styles.qcBtnText, qcResult === 'FAILED' && styles.qcBtnTextFailed]}>✕ QC FAILED</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {stage === 'DISPATCH' && (
              <View style={{ marginTop: Spacing.sm, gap: Spacing.xs }}>
                <Text style={styles.inputLabel}>Transport Vehicle / Carrier Info:</Text>
                <TextInput
                  style={styles.input}
                  value={logisticsEntry}
                  onChangeText={setLogisticsEntry}
                  placeholder="e.g. VRL Container Truck #MH-12-AB-9876"
                />

                <Text style={styles.inputLabel}>LR Docket / E-Way Bill Number:</Text>
                <TextInput
                  style={styles.input}
                  value={transportRef}
                  onChangeText={setTransportRef}
                  placeholder="e.g. TRP-10-TON-4491"
                />
              </View>
            )}

            <Text style={styles.inputLabel}>Process Remarks & Notes:</Text>
            <TextInput
              style={[styles.input, { height: 50 }]}
              multiline
              placeholder="Optional notes for audit logs..."
              placeholderTextColor="#94a3b8"
              value={remarks}
              onChangeText={setRemarks}
            />

            {/* Submit Action Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>
                ✓ Confirm & Record {inputQty ? `${inputQty} PCS` : 'Batch Quantity'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    width: '100%',
    maxWidth: 500,
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
  headerTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: Colors.accentTeal,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: Colors.textSubtle,
    fontSize: 16,
    fontWeight: '800',
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  metricLbl: {
    color: Colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderDark,
  },
  promptText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  vendorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  chipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  chipText: {
    color: Colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.white,
  },
  qcBtn: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  qcBtnPassed: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: Colors.successBright,
  },
  qcBtnFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: Colors.dangerBright,
  },
  qcBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  qcBtnTextPassed: {
    color: Colors.successBright,
  },
  qcBtnTextFailed: {
    color: Colors.dangerBright,
  },
  submitBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.glowOrange,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.industrialOrange,
    fontSize: 11,
    fontWeight: '700',
  },
});
