import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { Order, QCResult } from '../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../theme';
import { useERP } from '../context/ERPContext';
import { SearchableDropdown } from './ui/SearchableDropdown';

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
    passedQty?: number;
    failedQty?: number;
    transportRef?: string;
    logisticsEntry?: string;
  }) => void;
  isRework?: boolean;
}

export const QuantityProcessModal: React.FC<QuantityProcessModalProps> = ({
  visible,
  order,
  stage,
  onClose,
  onSubmit,
  isRework,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { vendors } = useERP();
  const [inputQty, setInputQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [vendorSelected, setVendorSelected] = useState('');
  const [qcResult, setQcResult] = useState<QCResult>('PASSED');
  const [transportRef, setTransportRef] = useState('');
  const [logisticsEntry, setLogisticsEntry] = useState('');
  const [passedQty, setPassedQty] = useState('');
  const [failedQty, setFailedQty] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Use real vendors from context; fall back to defaults if none exist
  const vendorList = vendors.length > 0
    ? vendors.filter((v) => v.status === 'ACTIVE').map((v) => v.vendorName)
    : ['Jindal Stainless Steel Works', 'Global Steel Supply Inc.', 'Bharat Forgings Vendor Unit A', 'Apex Alloys & Tubes Ltd'];

  const defaultVendor = vendorList[0] || 'Jindal Stainless Steel Works';

  useEffect(() => {
    if (order) {
      setInputQty('');
      setRemarks('');
      setVendorSelected(order.vendorSelected || defaultVendor);
      setQcResult('PASSED');
      setQcResult('PASSED');
      setPassedQty('');
      setFailedQty('');
      setTransportRef('');
      setLogisticsEntry('');
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
    stageTitle = 'Material Item & Vendor Procurement Report';
    questionPrompt = 'How many material item units have been purchased & received?';
    alreadyProcessed = order.purchaseQuantity || 0;
    maxAvailable = Math.max(0, totalQty - alreadyProcessed);
  } else if (stage === 'PRODUCTION') {
    stageTitle = isRework ? 'Production Rework Update' : 'Production & Manufacturing Output Update';
    questionPrompt = isRework ? 'How many reworked items have been fixed?' : 'How many finished items have been produced?';
    alreadyProcessed = isRework ? 0 : (order.productionQuantity || 0);
    const availableMaterial = (order.purchaseRequired && (order.purchaseQuantity !== undefined && order.purchaseQuantity !== null))
      ? (order.purchaseQuantity || 0)
      : totalQty;
    maxAvailable = isRework ? (order.reworkQuantity || 0) : Math.max(0, availableMaterial - alreadyProcessed);
  } else if (stage === 'QUALITY_TESTING') {
    stageTitle = 'Quality Testing & Inspection Result Log';
    questionPrompt = 'Enter the number of passed and failed items.';
    alreadyProcessed = order.qcPassedQuantity || 0;
    const producedAvailable = order.productionQuantity || 0;
    maxAvailable = Math.max(0, producedAvailable - (order.qcPassedQuantity || 0));
  } else if (stage === 'DISPATCH') {
    stageTitle = 'Dispatch & Logistics Shipment Process';
    questionPrompt = 'How many items are being dispatched in this shipment?';
    alreadyProcessed = order.dispatchQuantity || 0;
    const passedQc = order.qualityTestingRequired
      ? (order.qcPassedQuantity !== undefined
          ? order.qcPassedQuantity
          : order.qcResult === 'PASSED'
          ? (order.qcQuantity || 0)
          : 0)
      : (order.productionQuantity || 0);
    maxAvailable = Math.max(0, passedQc - alreadyProcessed);
  }

  const remainingQty = Math.max(0, maxAvailable);

  const handleSubmit = () => {
    setErrorMsg('');

    if (stage === 'QUALITY_TESTING') {
      const pQty = Number(passedQty);
      const fQty = Number(failedQty);

      if (passedQty.trim() === '' && failedQty.trim() === '') {
        setErrorMsg('Please enter either passed or failed quantity.');
        return;
      }
      if (isNaN(pQty) || isNaN(fQty) || pQty < 0 || fQty < 0 || (pQty === 0 && fQty === 0)) {
        setErrorMsg('Please enter valid quantities.');
        return;
      }
      if (pQty + fQty > maxAvailable) {
        setErrorMsg(`Total QC quantity cannot exceed available uninspected quantity (${maxAvailable} PCS).`);
        return;
      }
      
      onSubmit({
        processedQty: pQty + fQty,
        passedQty: pQty,
        failedQty: fQty,
        remarks: remarks.trim() || undefined,
        qcResult: fQty > 0 ? (pQty > 0 ? undefined : 'FAILED') : 'PASSED',
      });
      return;
    }

    const val = Number(inputQty);

    if (!inputQty.trim() || isNaN(val) || val <= 0) {
      setErrorMsg('Please enter a valid quantity greater than 0.');
      return;
    }
    if (val > maxAvailable) {
      if (stage === 'PRODUCTION' && order.purchaseRequired && (order.purchaseQuantity || 0) < totalQty) {
        setErrorMsg(`Cannot produce ${val} units. Only ${order.purchaseQuantity || 0} PCS raw material has been received so far (${alreadyProcessed} PCS already produced). Available for production: ${maxAvailable} PCS.`);
      } else {
        setErrorMsg(`Quantity cannot exceed remaining quantity available for this stage (${maxAvailable} PCS).`);
      }
      return;
    }
    if (!isRework && alreadyProcessed + val > totalQty) {
      setErrorMsg(`Total processed quantity cannot exceed total order quantity (${totalQty} PCS).`);
      return;
    }

    onSubmit({
      processedQty: val,
      remarks: remarks.trim() || undefined,
      vendorSelected: stage === 'PURCHASE' ? vendorSelected : undefined,
      transportRef: stage === 'DISPATCH' ? transportRef : undefined,
      logisticsEntry: stage === 'DISPATCH' ? logisticsEntry : undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={[styles.overlay, isMobile && { padding: 10 }]} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.modalCard, isMobile && { padding: 14, maxHeight: '95%' }]} onPress={(e) => e.stopPropagation()}>
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

            {/* Item Sourcing & Vendor Procurement Report Card for PURCHASE stage */}
            {stage === 'PURCHASE' && (
              <View style={styles.procurementReportCard}>
                <View style={styles.procurementReportHeader}>
                  <Text style={styles.procurementReportTitle}>📊 Item & Vendor Sourcing Report</Text>
                  <View style={[
                    styles.vendorStatusBadge,
                    { backgroundColor: alreadyProcessed >= totalQty ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 119, 6, 0.15)', borderColor: alreadyProcessed >= totalQty ? '#10b981' : '#d97706' }
                  ]}>
                    <Text style={[
                      styles.vendorStatusBadgeText,
                      { color: alreadyProcessed >= totalQty ? '#10b981' : '#d97706' }
                    ]}>
                      {alreadyProcessed >= totalQty ? '✓ FULLY PURCHASED' : '⏳ SOURCING IN PROGRESS'}
                    </Text>
                  </View>
                </View>

                <View style={styles.procurementReportGrid}>
                  <View style={styles.procurementReportItem}>
                    <Text style={styles.procurementReportLabel}>📦 Purchased Item / Material Spec:</Text>
                    <Text style={styles.procurementReportValBold}>{order.materialRequirements || 'SS316L Raw Flange Billets'}</Text>
                  </View>

                  <View style={styles.procurementReportItem}>
                    <Text style={styles.procurementReportLabel}>🏢 Purchased From (Vendor):</Text>
                    <Text style={[styles.procurementReportValBold, { color: Colors.accentTeal }]}>
                      {vendorSelected || order.vendorSelected || 'Jindal Stainless Steel Works'}
                    </Text>
                  </View>

                  <View style={styles.procurementReportItem}>
                    <Text style={styles.procurementReportLabel}>🔢 Order Quantity Sourced:</Text>
                    <Text style={styles.procurementReportVal}>
                      <Text style={{ fontWeight: '800', color: Colors.textLight }}>{alreadyProcessed}</Text> / {totalQty} PCS ({remainingQty} PCS Remaining)
                    </Text>
                  </View>

                  {order.poNumber ? (
                    <View style={styles.procurementReportItem}>
                      <Text style={styles.procurementReportLabel}>📜 PO Reference Number:</Text>
                      <Text style={styles.procurementReportVal}>{order.poNumber}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

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
            {stage !== 'QUALITY_TESTING' ? (
              <>
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
              </>
            ) : null}

            {/* Stage-Specific Fields */}
            {stage === 'PURCHASE' && (
              <View style={{ marginTop: Spacing.sm }}>
                <SearchableDropdown
                  label="Material Vendor / Supplier:"
                  placeholder="Search or select material vendor..."
                  options={vendorList.map((v) => ({
                    id: v,
                    label: v,
                    sublabel: 'Approved Supplier',
                    icon: '🏭',
                  }))}
                  selectedValue={vendorSelected}
                  onSelect={(v) => setVendorSelected(v)}
                />
              </View>
            )}

            {stage === 'QUALITY_TESTING' && (
              <View style={{ marginTop: Spacing.sm, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 4 }}>
                  Inspection Results Breakdown:
                </Text>

                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  {/* Left Box: PASS */}
                  <View style={{ flex: 1, backgroundColor: '#f0fdf4', padding: 10, borderRadius: Radius.md, borderWidth: 1.5, borderColor: '#16a34a' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Text style={{ fontSize: 16 }}>✓</Text>
                      <Text style={{ color: '#15803d', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>PASS</Text>
                      <Text style={{ color: '#166534', fontSize: 12, fontWeight: '600' }}>(Passed Qty)</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { fontSize: 16, fontWeight: '800', color: '#15803d', borderColor: '#16a34a', borderWidth: 1.5, backgroundColor: '#ffffff' }]}
                      placeholder="Pass Qty (e.g. 40)"
                      placeholderTextColor="#94a3b8"
                      value={passedQty}
                      onChangeText={setPassedQty}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Right Box: FAIL */}
                  <View style={{ flex: 1, backgroundColor: '#fef2f2', padding: 10, borderRadius: Radius.md, borderWidth: 1.5, borderColor: '#dc2626' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Text style={{ fontSize: 16 }}>✕</Text>
                      <Text style={{ color: '#b91c1c', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>FAIL</Text>
                      <Text style={{ color: '#991b1b', fontSize: 12, fontWeight: '600' }}>(Failed Qty)</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { fontSize: 16, fontWeight: '800', color: '#b91c1c', borderColor: '#dc2626', borderWidth: 1.5, backgroundColor: '#ffffff' }]}
                      placeholder="Fail Qty (e.g. 60)"
                      placeholderTextColor="#94a3b8"
                      value={failedQty}
                      onChangeText={setFailedQty}
                      keyboardType="numeric"
                    />
                  </View>
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
    maxHeight: '90%',
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
  procurementReportCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.md,
  },
  procurementReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  procurementReportTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  vendorStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  vendorStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  procurementReportGrid: {
    gap: 6,
    marginTop: 4,
  },
  procurementReportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  procurementReportLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  procurementReportValBold: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '800',
  },
  procurementReportVal: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
