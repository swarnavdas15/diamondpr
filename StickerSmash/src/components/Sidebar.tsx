import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { NavMenuItem } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';

interface SidebarProps {
  activeMenuItem: NavMenuItem;
  onSelectMenuItem: (item: NavMenuItem) => void;
  collapsed: boolean;
  onToggleCollapse?: () => void;
}

interface MenuDef {
  id: NavMenuItem;
  label: string;
  icon: string;
}

const MENU_ITEMS: MenuDef[] = [
  { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ClientDirectory', label: 'Client Directory', icon: '📇' },
  { id: 'Orders', label: 'Orders', icon: '📋' },
  { id: 'Quotations', label: 'Quotations', icon: '📜' },
  { id: 'WorkOrders', label: 'Work Orders', icon: '⚙️' },
  { id: 'PurchaseOrders', label: 'Purchase Orders', icon: '🛍️' },
  { id: 'DispatchQueue', label: 'Dispatch Queue', icon: '📦' },
  { id: 'Logistics', label: 'Logistics', icon: '🚚' },
  { id: 'QualityControl', label: 'Quality Control', icon: '🔍' },
  { id: 'Purchase', label: 'Purchase', icon: '🛒' },
  { id: 'Production', label: 'Production', icon: '🏭' },
  { id: 'Dispatch', label: 'Dispatch', icon: '🚛' },
  { id: 'Vendors', label: 'Vendors', icon: '🏢' },
  { id: 'Tasks', label: 'Tasks', icon: '☑️' },
  { id: 'Notifications', label: 'Notifications', icon: '🔔' },
  { id: 'Users', label: 'Users', icon: '👤' },
  { id: 'Reports', label: 'Reports', icon: '📈' },
  { id: 'Settings', label: 'ERP Settings', icon: '⚙️' },
  { id: 'ActivityLogs', label: 'Activity Logs', icon: '📜' },
  { id: 'Logout', label: 'Logout', icon: '🚪' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenuItem,
  onSelectMenuItem,
  collapsed,
}) => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const getRoleBadgeColor = (role: string) => {
    return (Colors.roles as any)[role] || Colors.accentTeal;
  };

  const getAllowedMenuItems = (role: string): NavMenuItem[] => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          'Dashboard',
          'ClientDirectory',
          'Quotations',
          'Purchase',
          'Production',
          'Dispatch',
          'Users',
          'Reports',
          'Settings',
          'Logout',
        ];
      case 'ADMIN':
        return [
          'Dashboard',
          'ClientDirectory',
          'Quotations',
          'Purchase',
          'Production',
          'Dispatch',
          'Users',
          'Reports',
          'Logout',
        ];
      case 'SALES':
        return [
          'Dashboard',
          'ClientDirectory',
          'Quotations',
          'Tasks',
          'Logout',
        ];
      case 'PURCHASE':
        return [
          'Dashboard',
          'Vendors',
          'Tasks',
          'Logout',
        ];
      case 'PRODUCTION':
      case 'QUALITY_TESTING':
        return [
          'Dashboard',
          'Tasks',
          'Logout',
        ];
      case 'DISPATCH':
        return [
          'Dashboard',
          'Tasks',
          'Logout',
        ];
      default:
        return ['Dashboard', 'Logout'];
    }
  };

  const allowedNavItems = getAllowedMenuItems(currentUser.role);
  const visibleMenuItems = MENU_ITEMS.filter((item) => allowedNavItems.includes(item.id));

  return (
    <View style={[styles.sidebarContainer, collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded]}>
      {/* Top Header: Company Logo */}
      <View style={styles.brandHeader}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoSymbol}>❖</Text>
          </View>
          {!collapsed && (
            <View style={styles.brandTitleContainer}>
              <Text style={styles.brandTitle}>DIAMOND FLANGE</Text>
              <Text style={styles.brandTag}>INDUSTRIAL ERP</Text>
            </View>
          )}
        </View>
      </View>

      {/* User Profile Section */}
      <View style={[styles.profileSection, collapsed && styles.profileSectionCollapsed]}>
        <View style={[styles.avatarCircle, { backgroundColor: getRoleBadgeColor(currentUser.role) }]}>
          <Text style={styles.avatarText}>{currentUser.name.charAt(0)}</Text>
        </View>
        {!collapsed && (
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {currentUser.name}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(currentUser.role) }]}>
              <Text style={styles.roleBadgeText}>{currentUser.role.replace('_', ' ')}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* Navigation Menu List */}
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        {visibleMenuItems.map((item) => {
          const isActive = activeMenuItem === item.id;
          const isLogout = item.id === 'Logout';

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItemBtn,
                isActive && styles.menuItemActive,
                isLogout && styles.menuItemLogout,
                collapsed && styles.menuItemCollapsed,
              ]}
              onPress={() => {
                if (isLogout) {
                  logout();
                } else {
                  onSelectMenuItem(item.id);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemIcon, isActive && styles.iconActive]}>{item.icon}</Text>

              {!collapsed && (
                <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive, isLogout && styles.logoutText]}>
                  {item.label}
                </Text>
              )}

              {!collapsed && isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sidebar Footer */}
      {!collapsed && (
        <View style={styles.sidebarFooter}>
          <Text style={styles.versionText}>ERP v2.4 • Centralized Theme Edition</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    backgroundColor: Colors.cardBg,
    borderRightWidth: 1,
    borderRightColor: Colors.borderDark,
    flexDirection: 'column',
    height: '100%',
    ...Shadows.sm,
    zIndex: 10,
  },
  sidebarExpanded: {
    width: 260,
  },
  sidebarCollapsed: {
    width: 72,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.px14,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.px10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.industrialOrange,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glowOrange,
  },
  logoSymbol: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  brandTitleContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandTag: {
    color: Colors.accentTeal,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.px14,
    paddingVertical: Spacing.px14,
    gap: Spacing.md,
    backgroundColor: Colors.inputBg,
    marginHorizontal: Spacing.px10,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  profileSectionCollapsed: {
    marginHorizontal: Spacing.px6,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: Spacing.px6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDark,
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.px14,
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: Spacing.px10,
  },
  menuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: Spacing.px14,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xs,
    position: 'relative',
  },
  menuItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  menuItemActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
    borderWidth: 1,
    ...Shadows.sm,
  },
  menuItemLogout: {
    marginTop: Spacing.px10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  menuItemIcon: {
    fontSize: 18,
  },
  iconActive: {
    transform: [{ scale: 1.1 }],
  },
  menuItemText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: Spacing.md,
    flex: 1,
  },
  menuItemTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  logoutText: {
    color: Colors.industrialOrange,
  },
  activeIndicator: {
    width: 4,
    height: 16,
    backgroundColor: Colors.highlightOrange,
    borderRadius: Radius.xs,
    position: 'absolute',
    right: 8,
  },
  sidebarFooter: {
    paddingVertical: Spacing.px14,
    paddingHorizontal: Spacing.px14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    alignItems: 'center',
  },
  versionText: {
    color: Colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
});
