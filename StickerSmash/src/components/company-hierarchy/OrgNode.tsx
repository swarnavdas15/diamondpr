import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CompanyContact } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface OrgNodeProps {
  contact: CompanyContact;
  hasChildren: boolean;
  isExpanded: boolean;
  directReportsCount: number;
  isSelected?: boolean;
  onSelectNode: (contact: CompanyContact) => void;
  onToggleExpand?: (contactId: string) => void;
}

export const OrgNode: React.FC<OrgNodeProps> = ({
  contact,
  hasChildren,
  isExpanded,
  directReportsCount,
  isSelected,
  onSelectNode,
  onToggleExpand,
}) => {
  const initialLetter = contact.fullName.charAt(0).toUpperCase();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.nodeCard, isSelected && styles.nodeCardSelected]}
        onPress={() => onSelectNode(contact)}
        activeOpacity={0.8}
      >
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {contact.fullName}
            </Text>
            <Text style={styles.designation} numberOfLines={1}>
              {contact.designation}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.deptBadge}>
            <Text style={styles.deptBadgeText} numberOfLines={1}>
              {contact.department || 'General'}
            </Text>
          </View>

          {directReportsCount > 0 && (
            <View style={styles.reportsBadge}>
              <Text style={styles.reportsBadgeText}>👥 {directReportsCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Branch Expand/Collapse Toggle Button below node */}
      {hasChildren && onToggleExpand && (
        <TouchableOpacity
          style={styles.expandToggleBtn}
          onPress={() => onToggleExpand(contact.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandToggleText}>{isExpanded ? '−' : '+'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 6,
  },
  nodeCard: {
    width: 210,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  nodeCardSelected: {
    borderColor: Colors.accentTeal,
    backgroundColor: 'rgba(41, 88, 92, 0.06)',
    borderWidth: 2,
    ...Shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  name: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  designation: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  deptBadge: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    maxWidth: 130,
  },
  deptBadgeText: {
    color: Colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
  reportsBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  reportsBadgeText: {
    color: Colors.roles.SALES,
    fontSize: 10,
    fontWeight: '800',
  },
  expandToggleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accentTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  expandToggleText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
    marginTop: -2,
  },
});
