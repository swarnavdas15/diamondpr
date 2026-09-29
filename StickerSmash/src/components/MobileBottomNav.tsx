import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavMenuItem } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';

interface MobileBottomNavProps {
  activeMenuItem: NavMenuItem;
  onSelectMenuItem: (item: NavMenuItem) => void;
  onOpenMenu: () => void;
  userRole?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeMenuItem,
  onSelectMenuItem,
  onOpenMenu,
  userRole,
}) => {
  const getSecondTab = (): { id: NavMenuItem; label: string; icon: string } => {
    if (userRole === 'SALES' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return { id: 'Quotations', label: 'Quotations', icon: '📜' };
    }
    if (userRole === 'PURCHASE') {
      return { id: 'Purchase', label: 'Purchase', icon: '🛒' };
    }
    if (userRole === 'PRODUCTION') {
      return { id: 'WorkOrders', label: 'Work Orders', icon: '⚙️' };
    }
    if (userRole === 'QUALITY_TESTING') {
      return { id: 'QualityControl', label: 'QC Test', icon: '🔍' };
    }
    if (userRole === 'DISPATCH') {
      return { id: 'DispatchQueue', label: 'Dispatch', icon: '🚛' };
    }
    return { id: 'Orders', label: 'Orders', icon: '📋' };
  };

  const getThirdTab = (): { id: NavMenuItem; label: string; icon: string } => {
    if (userRole === 'PURCHASE') {
      return { id: 'Vendors', label: 'Vendors', icon: '🏢' };
    }
    if (userRole === 'SALES' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return { id: 'Orders', label: 'Orders', icon: '📋' };
    }
    if (userRole === 'QUALITY_TESTING') {
      return { id: 'Tasks', label: 'Tasks', icon: '☑️' };
    }
    if (userRole === 'DISPATCH') {
      return { id: 'Tasks', label: 'Tasks', icon: '☑️' };
    }
    // PRODUCTION default
    return { id: 'Tasks', label: 'Tasks', icon: '☑️' };
  };

  const secondTab = getSecondTab();
  const thirdTab = getThirdTab();

  // Build nav items — deduplicate so Tasks doesn't appear twice if thirdTab already returns Tasks
  const rawItems = [
    { id: 'Dashboard' as NavMenuItem, label: 'Dashboard', icon: '📊' },
    secondTab,
    thirdTab,
    { id: 'Tasks' as NavMenuItem, label: 'Tasks', icon: '☑️' },
  ];
  const seen = new Set<string>();
  const navItems = rawItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeMenuItem === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onSelectMenuItem(item.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{item.icon}</Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Drawer Menu Button */}
      <TouchableOpacity style={styles.navItem} onPress={onOpenMenu} activeOpacity={0.7}>
        <Text style={styles.navIcon}>☰</Text>
        <Text style={styles.navLabel}>Menu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as any,
    bottom: 0,
    left: 0,
    right: 0,
    height: (Platform.OS === 'web' ? ('calc(env(safe-area-inset-bottom, 0px) + 58px)' as any) : 58),
    paddingBottom: (Platform.OS === 'web' ? ('env(safe-area-inset-bottom, 0px)' as any) : 0),
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xs,
    zIndex: 1000,
    ...Shadows.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  navItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: Radius.md,
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
    color: Colors.textMuted,
  },
  navIconActive: {
    color: Colors.accentTeal,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  navLabelActive: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
});
