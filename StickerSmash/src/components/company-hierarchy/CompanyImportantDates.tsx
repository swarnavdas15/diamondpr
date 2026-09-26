import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, StyleSheet } from 'react-native';
import { CompanyImportantDate, CompanyDateType } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface CompanyImportantDatesProps {
  companyId: string;
  importantDates: CompanyImportantDate[];
  canManage: boolean;
  onAddImportantDate: (data: Omit<CompanyImportantDate, 'id' | 'createdAt'>) => void;
  onDeleteImportantDate: (id: string) => void;
}

const DATE_TYPES: { type: CompanyDateType; label: string; icon: string; color: string }[] = [
  { type: 'CONTRACT_RENEWAL', label: 'Contract Renewal', icon: '📝', color: '#0284C7' },
  { type: 'AUDIT', label: 'ISO & Quality Audit', icon: '🔍', color: Colors.industrialOrange },
  { type: 'CERTIFICATION', label: 'Certification Expiry', icon: '🏅', color: '#8B5CF6' },
  { type: 'MEETING', label: 'Executive Meeting', icon: '🤝', color: Colors.accentTeal },
  { type: 'PAYMENT_DUE', label: 'Commercial Credit Due', icon: '💰', color: '#D97706' },
  { type: 'MILESTONE', label: 'Company Milestone / Bday', icon: '🎉', color: '#EC4899' },
  { type: 'OTHER', label: 'Custom Reminder', icon: '📌', color: Colors.textMuted },
];

export const CompanyImportantDates: React.FC<CompanyImportantDatesProps> = ({
  companyId,
  importantDates,
  canManage,
  onAddImportantDate,
  onDeleteImportantDate,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [dateType, setDateType] = useState<CompanyDateType>('CONTRACT_RENEWAL');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleOpenAdd = () => {
    setTitle('');
    setDateType('CONTRACT_RENEWAL');
    setEventDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setError('');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    setError('');
    if (!title.trim()) {
      setError('Title / Event Name is required.');
      return;
    }
    if (!eventDate.trim()) {
      setError('Event Date (YYYY-MM-DD) is required.');
      return;
    }

    onAddImportantDate({
      companyId,
      title: title.trim(),
      dateType,
      eventDate: eventDate.trim(),
      description: description.trim(),
    });

    setModalVisible(false);
  };

  const getDateMeta = (type: CompanyDateType) => {
    return DATE_TYPES.find((d) => d.type === type) || DATE_TYPES[6];
  };

  return (
    <View style={styles.container}>
      {/* Top Banner Row */}
      <View style={styles.bannerRow}>
        <View>
          <Text style={styles.bannerTitle}>📅 Important Company Dates & Milestones</Text>
          <Text style={styles.bannerSub}>
            Track contract renewals, ISO audits, board meetings, payment credit milestones, and executive anniversaries.
          </Text>
        </View>

        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
            <Text style={styles.addBtnText}>+ Add Important Date</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dates Cards List */}
      {importantDates.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No Important Dates Saved</Text>
          <Text style={styles.emptySub}>
            Click "+ Add Important Date" to schedule contract renewals, plant audits, or key corporate milestones.
          </Text>
        </View>
      ) : (
        <View style={styles.datesGrid}>
          {importantDates.map((item) => {
            const meta = getDateMeta(item.dateType);
            return (
              <View key={item.id} style={[styles.dateCard, { borderLeftColor: meta.color }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeIcon}>{meta.icon}</Text>
                    <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>

                  <View style={styles.dateTag}>
                    <Text style={styles.dateTagText}>📅 {item.eventDate}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>

                {item.description ? (
                  <Text style={styles.cardDesc}>{item.description}</Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.createdByText}>
                    Added by: {item.createdByName || 'Sales User'}
                  </Text>

                  {canManage && (
                    <TouchableOpacity
                      style={styles.deleteTouch}
                      onPress={() => onDeleteImportantDate(item.id)}
                    >
                      <Text style={styles.deleteText}>🗑 Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add Important Date Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>📅 Schedule New Important Date</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Event Title / Milestone Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Annual Flange Rate Contract Renewal 2026"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Event Category *</Text>
              <View style={styles.categoryGrid}>
                {DATE_TYPES.map((dt) => {
                  const active = dateType === dt.type;
                  return (
                    <TouchableOpacity
                      key={dt.type}
                      style={[styles.catChip, active && { backgroundColor: dt.color, borderColor: dt.color }]}
                      onPress={() => setDateType(dt.type)}
                    >
                      <Text style={[styles.catChipText, active && { color: Colors.white }]}>
                        {dt.icon} {dt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Event Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-10-15"
                placeholderTextColor="#94a3b8"
                value={eventDate}
                onChangeText={setEventDate}
              />

              <Text style={styles.label}>Description & Key Details</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                placeholder="Enter special renewal terms, audit requirements, or reminder instructions..."
                placeholderTextColor="#94a3b8"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Save Important Date</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  bannerRow: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  bannerTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  bannerSub: {
    color: Colors.textSubtle,
    fontSize: 12,
    marginTop: 2,
    maxWidth: 620,
  },
  addBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    color: Colors.textSubtle,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  datesGrid: {
    gap: Spacing.md,
  },
  dateCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderLeftWidth: 5,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dateTag: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  dateTagText: {
    color: Colors.roles.SALES,
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 4,
  },
  cardDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  createdByText: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  deleteTouch: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deleteText: {
    color: Colors.status.FAILED.bg,
    fontSize: 11,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '85%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.xs,
  },
  modalHeaderTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    color: Colors.textSubtle,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.status.FAILED.bg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  label: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textLight,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  catChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  catChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.accentTeal,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
