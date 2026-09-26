import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CalendarEvent } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface EventDetailsModalProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onDelete?: (eventId: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  visible,
  event,
  onClose,
  onDelete,
}) => {
  if (!event) return null;

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'FOLLOW_UP':
        return '#8b5cf6';
      case 'MEETING':
        return '#3b82f6';
      case 'DEADLINE':
        return '#f97316';
      case 'REMINDER':
        return '#06b6d4';
      case 'IMPORTANT_DATE':
        return '#ef4444';
      case 'MILESTONE':
        return '#10b981';
      default:
        return Colors.accentTeal;
    }
  };

  const categoryColor = getCategoryColor(event.type);

  // Extract client name or quotation reference if formatted in title
  const hasFollowUpFormat = event.title.includes('Follow-Up:') || event.title.includes('QT-');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.typeDot, { backgroundColor: categoryColor }]} />
              <Text style={styles.typeText}>{event.type.replace('_', ' ')}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.eventTitle}>{event.title}</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scheduled Date:</Text>
                <View style={styles.dateTag}>
                  <Text style={styles.dateTagText}>📅 {event.eventDate}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Assigned Executive:</Text>
                <Text style={styles.infoValBold}>{event.createdByName || 'Sales Executive'}</Text>
              </View>

              {hasFollowUpFormat && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Event Category:</Text>
                  <Text style={[styles.infoVal, { color: categoryColor, fontWeight: '800' }]}>
                    Quotation Follow-Up Reminder
                  </Text>
                </View>
              )}
            </View>

            {/* Event Description / Notes */}
            {event.description ? (
              <View style={styles.descBox}>
                <Text style={styles.descTitle}>📝 Details & Notes</Text>
                <Text style={styles.descText}>{event.description}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  onDelete(event.id);
                  onClose();
                }}
              >
                <Text style={styles.deleteBtnText}>🗑 Delete Event</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
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
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  typeText: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  closeBtn: {
    color: Colors.textSubtle,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    maxHeight: 300,
  },
  eventTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.md,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  infoVal: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  infoValBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
  dateTag: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  dateTagText: {
    color: Colors.roles.SALES,
    fontSize: 12,
    fontWeight: '800',
  },
  descBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.md,
  },
  descTitle: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  descText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  deleteBtnText: {
    color: Colors.status.FAILED.bg,
    fontSize: 12,
    fontWeight: '800',
  },
  closeModalBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  closeModalBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
