import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Colors, Spacing, Radius } from '../theme';

interface HeaderProps {
  onOpenCalendar: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCalendar, onToggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (!currentUser) return null;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const getRoleBadgeColor = (role: Role) => {
    return (Colors.roles as any)[role] || Colors.accentTeal;
  };

  return (
    <View style={[styles.headerContainer, isMobile && styles.headerContainerMobile]}>
      <View style={styles.brandLeftGroup}>
        {onToggleSidebar && (
          <TouchableOpacity style={styles.menuToggleBtn} onPress={onToggleSidebar}>
            <Text style={styles.menuToggleIcon}>☰</Text>
          </TouchableOpacity>
        )}
        <View style={styles.brandContainer}>
          <Text style={[styles.brandTitle, isMobile && styles.brandTitleMobile]}>DIAMOND FLANGE</Text>
          {!isMobile && <Text style={styles.brandSubtitle}>Advanced Manufacturing ERP</Text>}
        </View>
      </View>

      {/* Right Controls: Header Calendar, User Profile, Logout */}
      <View style={[styles.controlsContainer, isMobile && styles.controlsContainerMobile]}>
        {/* Global Compact Header Date Calendar Trigger */}
        <TouchableOpacity style={styles.dateHeaderBtn} onPress={onOpenCalendar}>
          <Text style={styles.calendarIcon}>📅</Text>
          {!isMobile && (
            <View>
              <Text style={styles.dateLabel}>TODAY</Text>
              <Text style={styles.dateValue}>{todayStr}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Profile Badge */}
        <View style={styles.userBadge}>
          <View style={[styles.avatarCircle, { backgroundColor: getRoleBadgeColor(currentUser.role) }]}>
            <Text style={styles.avatarText}>{currentUser.name.charAt(0)}</Text>
          </View>
          {!isMobile && (
            <View>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={[styles.userRoleTag, { color: getRoleBadgeColor(currentUser.role) }]}>
                {(currentUser?.role || '').replace('_', ' ')}
              </Text>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>{isMobile ? '🚪' : '🚪 Logout'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    height: 64,
  },
  headerContainerMobile: {
    paddingHorizontal: 12,
    paddingVertical: Spacing.xs,
    paddingTop: (Platform.OS === 'web' ? ('max(env(safe-area-inset-top, 24px), 24px)' as any) : 24),
    paddingBottom: 10,
    minHeight: 68,
    height: 'auto' as any,
  },
  brandLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexShrink: 1,
  },
  menuToggleBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.px6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  menuToggleIcon: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  brandContainer: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  brandTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandTitleMobile: {
    fontSize: 14,
  },
  brandSubtitle: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    flexShrink: 0,
  },
  controlsContainerMobile: {
    gap: Spacing.xs,
    flexShrink: 0,
  },
  dateHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.px6,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  calendarIcon: {
    fontSize: 16,
  },
  dateLabel: {
    color: Colors.accentTeal,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateValue: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  userName: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  userRoleTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
  },
  logoutBtnText: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '800',
  },
});
