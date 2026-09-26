import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Quotation } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface QuotationSentModalProps {
  visible: boolean;
  quotation: Quotation | null;
  onClose: () => void;
  onSave: (data: {
    sentVia: 'Email' | 'WhatsApp' | 'Phone' | 'Meeting' | 'Other';
    sentAt: string;
    sentNotes: string;
  }) => void;
}

export const QuotationSentModal: React.FC<QuotationSentModalProps> = ({
  visible,
  quotation,
  onClose,
  onSave,
}) => {
  const [sentVia, setSentVia] = useState<'Email' | 'WhatsApp' | 'Phone' | 'Meeting' | 'Other'>('Email');
  const [sentAt, setSentAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sentNotes, setSentNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!quotation) return null;

  const handleSubmit = () => {
    setError('');
    if (!sentAt.trim()) {
      setError('Sent Date & Time is required.');
      return;
    }

    onSave({
      sentVia,
      sentAt: sentAt.trim(),
      sentNotes: sentNotes.trim(),
    });
    handleClose();
  };

  const handleClose = () => {
    setSentVia('Email');
    setSentAt(new Date().toISOString().split('T')[0]);
    setSentNotes('');
    setError('');
    onClose();
  };

  const channels: Array<'Email' | 'WhatsApp' | 'Phone' | 'Meeting' | 'Other'> = [
    'Email',
    'WhatsApp',
    'Phone',
    'Meeting',
    'Other',
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Quotation Sent Details</Text>
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
              <Text style={styles.label}>Communication Method (Sent Via) *</Text>
              <View style={styles.chipRow}>
                {channels.map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={[styles.chip, sentVia === ch && styles.activeChip]}
                    onPress={() => setSentVia(ch)}
                  >
                    <Text style={[styles.chipText, sentVia === ch && styles.activeChipText]}>
                      {ch === 'Email' ? '📧 Email' : ch === 'WhatsApp' ? '💬 WhatsApp' : ch === 'Phone' ? '📞 Phone' : ch === 'Meeting' ? '🤝 Meeting' : '🌐 Other'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Sent Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={sentAt}
                onChangeText={setSentAt}
              />

              <Text style={styles.label}>Communication Notes & Dispatch Ref</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="e.g. Emailed quotation PDF to procurement head. Message delivered via WhatsApp business..."
                placeholderTextColor="#94a3b8"
                multiline
                value={sentNotes}
                onChangeText={setSentNotes}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>✓ Save Communication & Set Status: SENT</Text>
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
    maxWidth: 520,
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
    maxHeight: 380,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 6,
  },
  chip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  activeChip: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  activeChipText: {
    color: Colors.white,
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
