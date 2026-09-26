import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { CompanyContact } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface ContactManagementProps {
  contacts: CompanyContact[];
  canManage: boolean;
  onOpenAddContact: () => void;
  onOpenEditContact: (contact: CompanyContact) => void;
  onDeleteContact: (contactId: string) => void;
  onSelectContact: (contact: CompanyContact) => void;
}

export const ContactManagement: React.FC<ContactManagementProps> = ({
  contacts,
  canManage,
  onOpenAddContact,
  onOpenEditContact,
  onDeleteContact,
  onSelectContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Derive list of unique departments dynamically
  const departments = Array.from(new Set(contacts.map((c) => c.department).filter(Boolean)));

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    if (departmentFilter !== 'ALL' && c.department !== departmentFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.designation.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Action & Search Bar */}
      <View style={styles.topRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contact by name, designation, department..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={onOpenAddContact}>
            <Text style={styles.addBtnText}>+ Add Contact Person</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Department Filter Chips */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Filter Department:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, departmentFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setDepartmentFilter('ALL')}
          >
            <Text style={[styles.filterChipText, departmentFilter === 'ALL' && styles.filterChipTextActive]}>
              All ({contacts.length})
            </Text>
          </TouchableOpacity>

          {departments.map((dept) => {
            const count = contacts.filter((c) => c.department === dept).length;
            const isActive = departmentFilter === dept;
            return (
              <TouchableOpacity
                key={dept}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setDepartmentFilter(dept)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {dept} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contacts Table / Directory Cards */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Company Key Contacts Directory</Text>
          <Text style={styles.cardCount}>{filteredContacts.length} Contacts Listed</Text>
        </View>

        {filteredContacts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No contacts matching filter criteria.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.thRow}>
                <Text style={[styles.th, { width: 180 }]}>Full Name & Avatar</Text>
                <Text style={[styles.th, { width: 180 }]}>Designation</Text>
                <Text style={[styles.th, { width: 140 }]}>Department</Text>
                <Text style={[styles.th, { width: 140 }]}>Mobile / WhatsApp</Text>
                <Text style={[styles.th, { width: 180 }]}>Reports To (Manager)</Text>
                <Text style={[styles.th, { width: 140 }]}>Actions</Text>
              </View>

              {filteredContacts.map((c) => {
                const manager = c.reportsToId
                  ? contacts.find((m) => m.id === c.reportsToId)
                  : null;
                const initial = c.fullName.charAt(0).toUpperCase();

                return (
                  <View key={c.id} style={styles.trRow}>
                    {/* Name & Avatar */}
                    <TouchableOpacity
                      style={[styles.tdCell, { width: 180, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                      onPress={() => onSelectContact(c)}
                    >
                      <View style={styles.tableAvatar}>
                        <Text style={styles.tableAvatarText}>{initial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tdBold} numberOfLines={1}>
                          {c.fullName}
                        </Text>
                        <Text style={styles.tdSub} numberOfLines={1}>
                          {c.email || 'No Email'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Designation */}
                    <Text style={[styles.td, { width: 180 }]} numberOfLines={1}>
                      {c.designation}
                    </Text>

                    {/* Department */}
                    <View style={[{ width: 140 }, styles.tdCell]}>
                      <View style={styles.deptBadge}>
                        <Text style={styles.deptBadgeText} numberOfLines={1}>
                          {c.department || 'General'}
                        </Text>
                      </View>
                    </View>

                    {/* Phone */}
                    <Text style={[styles.td, { width: 140 }]} numberOfLines={1}>
                      {c.mobile}
                    </Text>

                    {/* Reports To */}
                    <Text style={[styles.tdHighlight, { width: 180 }]} numberOfLines={1}>
                      {manager ? `👤 ${manager.fullName}` : '👑 Top Level'}
                    </Text>

                    {/* Actions */}
                    <View style={[{ width: 140 }, styles.actionCell]}>
                      <TouchableOpacity style={styles.viewBtn} onPress={() => onSelectContact(c)}>
                        <Text style={styles.viewBtnText}>View</Text>
                      </TouchableOpacity>

                      {canManage && (
                        <>
                          <TouchableOpacity style={styles.editBtn} onPress={() => onOpenEditContact(c)}>
                            <Text style={styles.editBtnText}>✏</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteContact(c.id)}>
                            <Text style={styles.deleteBtnText}>🗑</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...Shadows.sm,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textLight,
    fontSize: 13,
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filterLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChip: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  filterChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.xs,
  },
  cardTitle: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '800',
  },
  cardCount: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBox: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  table: {
    minWidth: 960,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgDark,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 6,
  },
  th: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  tdCell: {
    justifyContent: 'center',
  },
  tableAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableAvatarText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
  tdSub: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  td: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  tdHighlight: {
    color: Colors.roles.SALES,
    fontSize: 12,
    fontWeight: '700',
  },
  deptBadge: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  deptBadgeText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewBtn: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  viewBtnText: {
    color: Colors.roles.SALES,
    fontSize: 11,
    fontWeight: '800',
  },
  editBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  editBtnText: {
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  deleteBtnText: {
    fontSize: 12,
  },
});
