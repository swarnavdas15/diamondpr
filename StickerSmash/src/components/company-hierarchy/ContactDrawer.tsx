import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { CompanyContact } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface ContactDrawerProps {
  visible: boolean;
  contact: CompanyContact | null;
  allCompanyContacts: CompanyContact[];
  canManage: boolean;
  onClose: () => void;
  onEdit?: (contact: CompanyContact) => void;
  onDelete?: (contactId: string) => void;
}

export const ContactDrawer: React.FC<ContactDrawerProps> = ({
  visible,
  contact,
  allCompanyContacts,
  canManage,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!contact) return null;

  // Find manager name
  const manager = contact.reportsToId
    ? allCompanyContacts.find((c) => c.id === contact.reportsToId)
    : null;

  // Count direct subordinates
  const directReports = allCompanyContacts.filter((c) => c.reportsToId === contact.id);

  // Clean WhatsApp number
  const waNumber = contact.whatsapp ? contact.whatsapp.replace(/\D/g, '') : contact.mobile.replace(/\D/g, '');
  const waUrl = `https://wa.me/${waNumber}`;

  const handleCall = () => {
    if (contact.mobile) {
      Linking.openURL(`tel:${contact.mobile}`);
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (waNumber) {
      Linking.openURL(waUrl);
    }
  };

  const initialLetter = contact.fullName.charAt(0).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.drawerCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contact & Hierarchy Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {/* Profile Avatar & Primary Banner */}
            <View style={styles.profileBanner}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialLetter}</Text>
              </View>
              <Text style={styles.name}>{contact.fullName}</Text>
              <Text style={styles.designation}>{contact.designation}</Text>

              <View style={styles.deptBadge}>
                <Text style={styles.deptBadgeText}>{contact.department || 'General'}</Text>
              </View>
            </View>

            {/* Quick Contact Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
                <Text style={styles.actionBtnIcon}>☎</Text>
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.emailBtn]} onPress={handleEmail}>
                <Text style={styles.actionBtnIcon}>📧</Text>
                <Text style={styles.actionBtnText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={handleWhatsApp}>
                <Text style={styles.actionBtnIcon}>💬</Text>
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {/* Hierarchy & Reporting Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>🌳 Reporting Structure</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reports To:</Text>
                <Text style={styles.infoValHighlight}>
                  {manager ? `👤 ${manager.fullName} (${manager.designation})` : '👑 Top Level Contact (Board / Head)'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Direct Reports Count:</Text>
                <View style={styles.subordinateTag}>
                  <Text style={styles.subordinateTagText}>
                    {directReports.length} Subordinates
                  </Text>
                </View>
              </View>

              {directReports.length > 0 && (
                <View style={styles.subordinateList}>
                  <Text style={styles.subListTitle}>Direct Subordinates:</Text>
                  {directReports.map((sub) => (
                    <Text key={sub.id} style={styles.subListItem}>
                      • {sub.fullName} <Text style={{ color: Colors.textSubtle }}>({sub.designation})</Text>
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Detailed Contact Numbers */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>📞 Communication Channels</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile Number:</Text>
                <Text style={styles.infoVal}>{contact.mobile}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>WhatsApp Number:</Text>
                <Text style={styles.infoVal}>{contact.whatsapp || contact.mobile}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Direct Link:</Text>
                <TouchableOpacity onPress={handleWhatsApp}>
                  <Text style={styles.waLinkText}>{waUrl}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoVal}>{contact.email || 'N/A'}</Text>
              </View>
            </View>

            {/* Notes Section */}
            {contact.notes ? (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>📝 Notes</Text>
                <Text style={styles.notesText}>{contact.notes}</Text>
              </View>
            ) : null}

            {/* Admin/Sales Edit & Delete Actions */}
            {canManage && (
              <View style={styles.manageRow}>
                {onEdit && (
                  <TouchableOpacity
                    style={[styles.manageBtn, styles.editBtn]}
                    onPress={() => {
                      onClose();
                      onEdit(contact);
                    }}
                  >
                    <Text style={styles.manageBtnText}>✏ Edit Contact</Text>
                  </TouchableOpacity>
                )}

                {onDelete && (
                  <TouchableOpacity
                    style={[styles.manageBtn, styles.deleteBtn]}
                    onPress={() => {
                      onClose();
                      onDelete(contact.id);
                    }}
                  >
                    <Text style={styles.manageBtnText}>🗑 Delete Contact</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  drawerCard: {
    width: '100%',
    maxWidth: 420,
    height: '100%',
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    color: Colors.textSubtle,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  profileBanner: {
    alignItems: 'center',
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: '800',
  },
  name: {
    color: Colors.textLight,
    fontSize: 17,
    fontWeight: '800',
  },
  designation: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  deptBadge: {
    backgroundColor: 'rgba(41, 88, 92, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    marginTop: Spacing.xs,
  },
  deptBadgeText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
    ...Shadows.sm,
  },
  callBtn: {
    backgroundColor: '#0284C7',
  },
  emailBtn: {
    backgroundColor: Colors.industrialOrange,
  },
  waBtn: {
    backgroundColor: '#22C55E',
  },
  actionBtnIcon: {
    fontSize: 14,
    color: Colors.white,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  infoSection: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  infoLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  infoVal: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  infoValHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  waLinkText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  subordinateTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  subordinateTagText: {
    color: Colors.status.COMPLETED.bg,
    fontSize: 11,
    fontWeight: '800',
  },
  subordinateList: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  subListTitle: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  subListItem: {
    color: Colors.textLight,
    fontSize: 12,
    marginLeft: 6,
    marginVertical: 2,
  },
  notesText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  manageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  manageBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Colors.status.FAILED.bg,
  },
  manageBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
});
