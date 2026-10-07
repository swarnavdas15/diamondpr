import { DatePickerInput } from '../ui/DatePickerInput';
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Quotation, QuotationStatus } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface QuotationFollowUpModalProps {
  visible: boolean;
  quotation: Quotation | null;
  targetStatus: 'UNDER_DISCUSSION' | 'NEGOTIATION';
  onClose: () => void;
  onSave: (data: {
    targetStatus: QuotationStatus;
    followUpDate: string;
    followUpTime?: string;
    notes: string;
    nextAction?: string;
    negotiationDate?: string;
    expectedClosureDate?: string;
  }) => void;
}

export const QuotationFollowUpModal: React.FC<QuotationFollowUpModalProps> = ({
  visible,
  quotation,
  targetStatus,
  onClose,
  onSave,
}) => {
  const [followUpDate, setFollowUpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState<string>('11:00 AM');
  const [notes, setNotes] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [negotiationDate, setNegotiationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedClosureDate, setExpectedClosureDate] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!quotation) return null;

  const isNegotiation = targetStatus === 'NEGOTIATION';

  const handleSubmit = () => {
    setError('');
    if (!followUpDate.trim()) {
      setError('Follow-Up Date is required.');
      return;
    }
    if (!notes.trim()) {
      setError('Discussion notes are required.');
      return;
    }

    onSave({
      targetStatus,
      followUpDate: followUpDate.trim(),
      followUpTime: followUpTime.trim(),
      notes: notes.trim(),
      nextAction: nextAction.trim(),
      negotiationDate: isNegotiation ? negotiationDate.trim() : undefined,
      expectedClosureDate: isNegotiation ? expectedClosureDate.trim() : undefined,
    });
    handleClose();
  };

  const handleClose = () => {
    setFollowUpDate(new Date().toISOString().split('T')[0]);
    setFollowUpTime('11:00 AM');
    setNotes('');
    setNextAction('');
    setNegotiationDate(new Date().toISOString().split('T')[0]);
    setExpectedClosureDate('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isNegotiation ? '📊 Sales Negotiation Entry' : '💬 Quotation Discussion & Follow-Up'}
              </Text>
              <Text style={styles.subTitle}>
                {quotation.quotationNumber} • {quotation.companyName}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              {isNegotiation ? (
                <>
                  <DatePickerInput label="Negotiation Date" value={negotiationDate} onChangeDate={setNegotiationDate} required />

                  <DatePickerInput label="Follow-Up Date" value={followUpDate} onChangeDate={setFollowUpDate} required />

                  <Text style={styles.label}>Revised Discussion Notes & Terms</Text>
                  <TextInput
                    style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                    placeholder="Enter price discount negotiations, payment terms revisions, or volume specs..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                  />

                  <DatePickerInput label="Expected Order Closure Date" value={expectedClosureDate} onChangeDate={setExpectedClosureDate} />
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <DatePickerInput label="Follow-Up Date" value={followUpDate} onChangeDate={setFollowUpDate} required />
                    </View>

                    <View style={{ width: 140 }}>
                      <Text style={styles.label}>Time</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 11:00 AM"
                        placeholderTextColor="#94a3b8"
                        value={followUpTime}
                        onChangeText={setFollowUpTime}
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Discussion Notes *</Text>
                  <TextInput
                    style={[styles.input, { height: 65, textAlignVertical: 'top' }]}
                    placeholder="Summarize client feedback, technical questions, or budget constraints..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                  />

                  <Text style={styles.label}>Next Action Item</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Send revised drawing, submit commercial discount proposal..."
                    placeholderTextColor="#94a3b8"
                    value={nextAction}
                    onChangeText={setNextAction}
                  />
                </>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>
                  ✓ Save Follow-Up & Set Status: {targetStatus.replace(/_/g, ' ')}
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
    maxWidth: 540,
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
    maxHeight: 400,
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
  submitBtn: {
    backgroundColor: Colors.accentTeal,
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
