import { DatePickerInput } from '../ui/DatePickerInput';
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Quotation, LostReason, CustomStage } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export interface QuotationConversionData {
  approvedAmount: number;
  requiredQuantity: number;
  finalRemarks: string;
  expectedDeliveryDate?: string;
  qualityTestingRequired: boolean;
  purchaseRequired: boolean;
  productionRequired: boolean;
  dispatchRequired: boolean;
  lostReason?: LostReason;
  lostRemarks?: string;
  customStages?: Omit<CustomStage, 'id' | 'createdAt' | 'status'>[];
}

interface QuotationConversionModalProps {
  visible: boolean;
  quotation: Quotation | null;
  onClose: () => void;
  onSubmitConversion: (data: QuotationConversionData) => void;
  externalError?: string;
}

const LOST_REASON_OPTIONS: { value: LostReason; label: string }[] = [
  { value: 'PRICE_TOO_HIGH', label: '💰 Price Too High / Concession Given' },
  { value: 'COMPETITOR_WON', label: '🏆 Competitor Won Partial Scope' },
  { value: 'CLIENT_BUDGET_ISSUE', label: '💳 Client Budget Constraints' },
  { value: 'TECHNICAL_REQUIREMENT_CHANGE', label: '🔧 Scope / Technical Change' },
  { value: 'PROJECT_CANCELLED', label: '❌ Project Scope Reduction' },
  { value: 'DELAYED_RESPONSE', label: '⏱️ Delayed Negotiation / Market Shift' },
  { value: 'OTHER', label: '📝 Other Reason' },
];

export const QuotationConversionModal: React.FC<QuotationConversionModalProps> = ({
  visible,
  quotation,
  onClose,
  onSubmitConversion,
  externalError,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [requiredQuantity, setRequiredQuantity] = useState<string>('1');
  const [finalRemarks, setFinalRemarks] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [qualityTestingRequired, setQualityTestingRequired] = useState<boolean>(true);
  const [purchaseRequired, setPurchaseRequired] = useState<boolean>(true);
  const [productionRequired, setProductionRequired] = useState<boolean>(true);
  const [dispatchRequired, setDispatchRequired] = useState<boolean>(true);
  const [lostReason, setLostReason] = useState<LostReason | ''>('');
  const [lostRemarks, setLostRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { currentUser, users } = useAuth();
  const [customStages, setCustomStages] = useState<Omit<CustomStage, 'id' | 'createdAt' | 'status'>[]>([]);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDesc, setNewStageDesc] = useState('');
  const [newStageUsers, setNewStageUsers] = useState<string[]>([]);

  React.useEffect(() => {
    if (quotation) {
      setApprovedAmount(String(quotation.quotationAmount));
      setRequiredQuantity('1');
      setFinalRemarks(quotation.remarks || '');
      setExpectedDeliveryDate('');
      setLostReason('');
      setLostRemarks('');
      setError('');
    }
  }, [quotation, visible]);

  React.useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  if (!quotation) return null;

  const originalAmount = quotation.quotationAmount;
  const approvedNum = Number(approvedAmount) || 0;
  const lostValue = Math.max(0, originalAmount - approvedNum);
  const lostPercent = originalAmount > 0 ? ((lostValue / originalAmount) * 100).toFixed(1) : '0.0';
  const isPartialConversion = approvedNum > 0 && approvedNum < originalAmount;
  const isFullConversion = approvedNum >= originalAmount;

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const handleSubmit = () => {
    setError('');
    const amtNum = Number(approvedAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setError('Please enter a valid Approved Order Amount.');
      return;
    }
    const qtyNum = Number(requiredQuantity);
    if (isNaN(qtyNum) || qtyNum <= 0 || !Number.isInteger(qtyNum)) {
      setError('Please enter a valid Required Quantity (whole number).');
      return;
    }
    if (isPartialConversion && !lostReason) {
      setError('Please select a reason for the partial conversion (lost value reason).');
      return;
    }

    onSubmitConversion({
      approvedAmount: amtNum,
      requiredQuantity: qtyNum,
      finalRemarks: finalRemarks.trim(),
      expectedDeliveryDate: expectedDeliveryDate.trim() || undefined,
      qualityTestingRequired,
      purchaseRequired,
      productionRequired,
      dispatchRequired,
      lostReason: lostReason as LostReason || undefined,
      lostRemarks: lostRemarks.trim() || undefined,
      customStages,
    });
    handleClose();
  };

  const handleClose = () => {
    setApprovedAmount('');
    setRequiredQuantity('1');
    setFinalRemarks('');
    setExpectedDeliveryDate('');
    setLostReason('');
    setLostRemarks('');
    setError('');
    setCustomStages([]);
    setIsAddingStage(false);
    setNewStageName('');
    setNewStageDesc('');
    setNewStageUsers([]);
    onClose();
  };

  const handleAddCustomStage = () => {
    if (!newStageName.trim()) {
      setError('Stage Name is required.');
      return;
    }
    if (newStageUsers.length === 0) {
      setError('Please assign at least one user to this stage.');
      return;
    }
    const userNames = newStageUsers.map(uid => users.find(u => u.id === uid)?.name || 'Unknown User');
    setCustomStages(prev => [...prev, {
      stageName: newStageName.trim(),
      description: newStageDesc.trim(),
      department: 'CUSTOM_STAGE',
      assignedUserIds: newStageUsers,
      assignedUserNames: userNames,
    }]);
    setNewStageName('');
    setNewStageDesc('');
    setNewStageUsers([]);
    setIsAddingStage(false);
    setError('');
  };

  const handleRemoveCustomStage = (idx: number) => {
    setCustomStages(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleStageUser = (uid: string) => {
    setNewStageUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity
        style={[styles.backdrop, isMobile && { padding: 8 }]}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.card, isMobile && { padding: 14, maxHeight: '96%' }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>📋 Quotation → Order Conversion</Text>
              <Text style={styles.subTitle}>
                {quotation.quotationNumber} • {quotation.companyName} ({quotation.clientCode})
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Original Quotation Value Reference */}
          <View style={styles.refBadge}>
            <Text style={styles.refBadgeText}>
              📜 Original Quotation Amount: {formatCurrency(originalAmount)}
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>

              {/* Approved Amount */}
              <Text style={styles.label}>Approved Order Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder={`e.g. ${originalAmount}`}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={approvedAmount}
                onChangeText={setApprovedAmount}
              />

              {/* Live Value Calculation Summary */}
              {approvedNum > 0 && (
                <View style={[
                  styles.calcCard,
                  isFullConversion ? styles.calcCardGreen : styles.calcCardOrange
                ]}>
                  <Text style={styles.calcTitle}>
                    {isFullConversion ? '✅ Full Conversion' : '⚠️ Partial Conversion — Value Variance'}
                  </Text>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Original Quotation:</Text>
                    <Text style={styles.calcVal}>{formatCurrency(originalAmount)}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Approved Order Value:</Text>
                    <Text style={[styles.calcVal, { color: Colors.successBright }]}>
                      {formatCurrency(approvedNum)}
                    </Text>
                  </View>
                  {lostValue > 0 && (
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Lost / Concession Value:</Text>
                      <Text style={[styles.calcVal, { color: '#ef4444' }]}>
                        -{formatCurrency(lostValue)} ({lostPercent}%)
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Lost Value Reason — shown only when partial conversion */}
              {isPartialConversion && (
                <View style={styles.lostReasonSection}>
                  <Text style={styles.lostReasonTitle}>
                    📉 Reason for Partial Conversion / Lost Value *
                  </Text>
                  <Text style={styles.lostReasonSub}>
                    The approved amount is lower than the quoted amount. Please select a reason for the {formatCurrency(lostValue)} shortfall.
                  </Text>
                  {LOST_REASON_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.lostChip, lostReason === opt.value && styles.lostChipActive]}
                      onPress={() => setLostReason(opt.value)}
                    >
                      <Text style={[styles.lostChipText, lostReason === opt.value && styles.lostChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.label}>Additional Lost Value Remarks (Optional)</Text>
                  <TextInput
                    style={[styles.input, { height: 55, textAlignVertical: 'top' }]}
                    placeholder="Describe negotiation details, competitor pricing, etc..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    value={lostRemarks}
                    onChangeText={setLostRemarks}
                  />
                </View>
              )}

              {/* Required Quantity */}
              <Text style={styles.label}>Required Order Quantity (PCS / Units) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={requiredQuantity}
                onChangeText={setRequiredQuantity}
              />

              {/* Expected Delivery Date */}
              <DatePickerInput label="Expected Delivery Date" value={expectedDeliveryDate} onChangeDate={setExpectedDeliveryDate} />

              {/* Pipeline Configuration */}
              <Text style={styles.label}>Configure Department Pipeline *</Text>
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
                    🔍 Quality {qualityTestingRequired ? '✓' : '✕'}
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

              {/* Custom Stages Section */}
              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SALES') && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.label}>Custom Pipeline Stages</Text>
                  
                  {customStages.map((stage, idx) => (
                    <View key={idx} style={styles.stageItem}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.stageItemTitle}>{stage.stageName}</Text>
                        <TouchableOpacity onPress={() => handleRemoveCustomStage(idx)}>
                          <Text style={{ color: '#ef4444', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      {stage.description ? <Text style={styles.stageItemDesc}>{stage.description}</Text> : null}
                      <View style={styles.userChipContainer}>
                        {stage.assignedUserNames.map((uName, i) => (
                          <View key={i} style={styles.userChip}>
                            <Text style={styles.userChipText}>{uName}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}

                  {isAddingStage ? (
                    <View style={styles.customStageContainer}>
                      <Text style={styles.customStageTitle}>Add New Stage</Text>
                      <TextInput
                        style={[styles.input, { marginBottom: 6 }]}
                        placeholder="Stage Name (e.g., Packaging)"
                        placeholderTextColor="#94a3b8"
                        value={newStageName}
                        onChangeText={setNewStageName}
                      />
                      <TextInput
                        style={[styles.input, { marginBottom: 6 }]}
                        placeholder="Purpose / Description"
                        placeholderTextColor="#94a3b8"
                        value={newStageDesc}
                        onChangeText={setNewStageDesc}
                      />
                      <Text style={[styles.label, { marginTop: 4, color: '#38bdf8' }]}>Assign Users (Multiple)</Text>
                      <View style={styles.userChipContainer}>
                        {users.map(u => {
                          const isSelected = newStageUsers.includes(u.id);
                          return (
                            <TouchableOpacity
                              key={u.id}
                              style={[styles.userChip, isSelected && styles.userChipActive]}
                              onPress={() => toggleStageUser(u.id)}
                            >
                              <Text style={[styles.userChipText, isSelected && styles.userChipTextActive]}>
                                {u.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        <TouchableOpacity 
                          style={{ flex: 1, backgroundColor: '#0f172a', padding: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderDark }}
                          onPress={() => setIsAddingStage(false)}
                        >
                          <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ flex: 1, backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#38bdf8' }}
                          onPress={handleAddCustomStage}
                        >
                          <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: '700' }}>Save Stage</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.addStageBtn} onPress={() => setIsAddingStage(true)}>
                      <Text style={styles.addStageBtnText}>+ Add New Stage</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Final Remarks */}
              <Text style={styles.label}>Order Remarks / Technical Notes</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Enter order terms, delivery instructions, drawing references..."
                placeholderTextColor="#94a3b8"
                multiline
                value={finalRemarks}
                onChangeText={setFinalRemarks}
              />

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>
                  🚀 Confirm Conversion & Initiate Order
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textLight,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    flexWrap: 'wrap',
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
    marginLeft: 8,
  },
  refBadge: {
    backgroundColor: 'rgba(41, 88, 92, 0.2)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    marginBottom: Spacing.sm,
  },
  refBadgeText: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    fontSize: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  formScroll: {
    maxHeight: 480,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  label: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 3,
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
  // Live calculation card
  calcCard: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    marginTop: 6,
    gap: 4,
  },
  calcCardGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  calcCardOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
  },
  calcTitle: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  calcVal: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  // Lost reason section
  lostReasonSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.07)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 6,
    gap: 6,
  },
  lostReasonTitle: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
  lostReasonSub: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginBottom: 4,
  },
  lostChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 3,
  },
  lostChipActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  lostChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  lostChipTextActive: {
    color: '#ef4444',
    fontWeight: '800',
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
  customStageContainer: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginTop: 8,
  },
  customStageTitle: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  addStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  addStageBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  stageItem: {
    backgroundColor: Colors.inputBg,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 6,
  },
  stageItemTitle: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  stageItemDesc: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  userChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  userChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  userChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38bdf8',
  },
  userChipText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  userChipTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
});
