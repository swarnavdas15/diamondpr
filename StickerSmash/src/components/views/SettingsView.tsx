import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useERP } from '../../context/ERPContext';
import { Role, User, Client, VisibilityPreset } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { CompanyDetailModal } from '../company-hierarchy/CompanyDetailModal';

type SettingsTab = 'USER_ACCESS' | 'CLIENT_DIRECTORY' | 'SIMULATOR' | 'AUDIT_LOGS';

const ROLE_DEPARTMENTS: Record<Role, { label: string; department: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', department: 'Executive Management', color: '#f59e0b' },
  ADMIN: { label: 'Admin', department: 'Plant Operations', color: '#3b82f6' },
  SALES: { label: 'Sales Department', department: 'Commercial & Accounts', color: '#10b981' },
  PURCHASE: { label: 'Purchase Department', department: 'Procurement & Supply Chain', color: '#8b5cf6' },
  PRODUCTION: { label: 'Production Department', department: 'Shop Floor & Machining', color: '#f97316' },
  QUALITY_TESTING: { label: 'Quality Testing', department: 'Inspection & QA Lab', color: '#06b6d4' },
  DISPATCH: { label: 'Dispatch Department', department: 'Logistics & Shipment', color: '#ec4899' },
};

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    users,
    authAuditLogs,
    setUserClientAccess,
    toggleUserClientAccess,
    setUserAmountAccess,
    toggleUserAmountAccess,
    setUserVisibilityPreset,
    setBulkVisibilityPreset,
    resetClientAccessToDefaults,
    hasClientAccess,
    hasAmountAccess,
    getUserPreset,
  } = useAuth();

  const { clients, quotations, orders } = useERP();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<SettingsTab>('USER_ACCESS');

  // Filter & Search State
  const [userSearch, setUserSearch] = useState('');
  const [presetFilter, setPresetFilter] = useState<'ALL' | VisibilityPreset>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Client Search State
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientForModal, setSelectedClientForModal] = useState<Client | null>(null);

  // Simulator State
  const [simulatedUserId, setSimulatedUserId] = useState<string>(
    users.find((u) => u.role !== 'SUPER_ADMIN')?.id || users[0]?.id || ''
  );

  // Toast / Status Message State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Metrics
  const totalUsers = users.length;
  const bothCount = useMemo(() => users.filter((u) => getUserPreset(u) === 'BOTH').length, [users, getUserPreset]);
  const nameOnlyCount = useMemo(() => users.filter((u) => getUserPreset(u) === 'NAME_ONLY').length, [users, getUserPreset]);
  const amountOnlyCount = useMemo(() => users.filter((u) => getUserPreset(u) === 'AMOUNT_ONLY').length, [users, getUserPreset]);
  const noneCount = useMemo(() => users.filter((u) => getUserPreset(u) === 'NONE').length, [users, getUserPreset]);
  const totalClientsCount = clients.length;

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const p = getUserPreset(u);
      if (presetFilter !== 'ALL' && p !== presetFilter) return false;
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

      if (userSearch.trim()) {
        const q = userSearch.toLowerCase().trim();
        const dept = ROLE_DEPARTMENTS[u.role]?.department.toLowerCase() || '';
        const roleLbl = ROLE_DEPARTMENTS[u.role]?.label.toLowerCase() || '';
        return (
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          dept.includes(q) ||
          roleLbl.includes(q)
        );
      }
      return true;
    });
  }, [users, presetFilter, roleFilter, userSearch, getUserPreset]);

  // Filtered Clients List
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.clientCode.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        (c.contactName && c.contactName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.gstNumber && c.gstNumber.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  // Simulated User
  const simulatedUser = users.find((u) => u.id === simulatedUserId) || users[0];
  const simulatedPreset = simulatedUser ? getUserPreset(simulatedUser) : 'NONE';
  const simulatedHasClient = simulatedUser ? hasClientAccess(simulatedUser) : false;
  const simulatedHasAmount = simulatedUser ? hasAmountAccess(simulatedUser) : false;

  // Handlers for Preset Updates
  const handleApplyPreset = (user: User, preset: VisibilityPreset) => {
    if (!isSuperAdmin) {
      showToast('Super Admin authorization is required to change access presets.', 'warning');
      return;
    }
    if (user.role === 'SUPER_ADMIN') {
      showToast('Super Admin account always retains full permanent access.', 'info');
      return;
    }
    try {
      setUserVisibilityPreset(user.id, preset);
      const presetLabels: Record<VisibilityPreset, string> = {
        BOTH: '🌟 Both (Client & Amount unmasked)',
        NAME_ONLY: '🏢 Name Only (Amount masked)',
        AMOUNT_ONLY: '💰 Amount Only (Client masked)',
        NONE: '🔒 None (Both masked)',
      };
      showToast(`Updated ${user.name} access preset to: ${presetLabels[preset]}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update preset.', 'warning');
    }
  };

  const handleToggleClient = (user: User) => {
    if (!isSuperAdmin) {
      showToast('Super Admin authorization is required.', 'warning');
      return;
    }
    if (user.role === 'SUPER_ADMIN') {
      showToast('Super Admin always has full access.', 'info');
      return;
    }
    try {
      toggleUserClientAccess(user.id);
      const next = !hasClientAccess(user);
      showToast(`Client Name visibility for ${user.name} is now ${next ? 'VISIBLE' : 'MASKED'}.`, next ? 'success' : 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle client access.', 'warning');
    }
  };

  const handleToggleAmount = (user: User) => {
    if (!isSuperAdmin) {
      showToast('Super Admin authorization is required.', 'warning');
      return;
    }
    if (user.role === 'SUPER_ADMIN') {
      showToast('Super Admin always has full access.', 'info');
      return;
    }
    try {
      toggleUserAmountAccess(user.id);
      const next = !hasAmountAccess(user);
      showToast(`Quotation Amount visibility for ${user.name} is now ${next ? 'VISIBLE' : 'MASKED'}.`, next ? 'success' : 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle amount access.', 'warning');
    }
  };

  // Bulk Handlers
  const handleBulkPreset = (preset: VisibilityPreset) => {
    if (!isSuperAdmin) {
      showToast('Super Admin authorization required.', 'warning');
      return;
    }
    try {
      setBulkVisibilityPreset(preset);
      const presetLabels: Record<VisibilityPreset, string> = {
        BOTH: '🌟 BOTH (Client Names & Quotation Amounts)',
        NAME_ONLY: '🏢 NAME ONLY (Quotation amounts masked)',
        AMOUNT_ONLY: '💰 AMOUNT ONLY (Client names masked)',
        NONE: '🔒 NONE (Both masked)',
      };
      showToast(`Bulk applied: All non-superadmin users set to ${presetLabels[preset]}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Bulk update failed.', 'warning');
    }
  };

  const handleResetDefaults = () => {
    if (!isSuperAdmin) {
      showToast('Super Admin authorization required.', 'warning');
      return;
    }
    try {
      resetClientAccessToDefaults();
      showToast('🔄 Reset to Defaults: Admin & Sales have BOTH access; Plant roles have NONE.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Reset failed.', 'warning');
    }
  };

  // Currency Formatter
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  // Sample data for live simulation
  const sampleQuotation = quotations[0] || {
    id: 'sample-1',
    quotationNumber: 'QT-2026-0881',
    quotationDate: '2026-03-24',
    clientCode: 'CL-1001',
    companyName: 'Apex Heavy Engineering Pvt Ltd',
    contactPerson: 'Anand Deshmukh',
    mobileNumber: '+91 98201 99887',
    email: 'anand@apexengineering.com',
    quotationAmount: 1250000,
    expectedOrderValue: 1200000,
    convertedOrderValue: 1180000,
    status: 'FULLY_CONVERTED',
    salesExecutive: 'Vikram Malhotra',
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Company Org Hierarchy Modal */}
      <CompanyDetailModal
        visible={!!selectedClientForModal}
        client={selectedClientForModal}
        onClose={() => setSelectedClientForModal(null)}
      />

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={{ flex: 1, paddingRight: Spacing.md }}>
          <View style={styles.bannerBadgeRow}>
            <View style={[styles.badgePill, isSuperAdmin ? styles.badgeSuperAdmin : styles.badgeAdmin]}>
              <Text style={styles.badgePillText}>
                {isSuperAdmin ? '👑 SUPER ADMIN CONTROL ACTIVE' : '🛡️ ADMIN READ-ONLY MODE'}
              </Text>
            </View>
            <View style={[styles.badgePill, styles.badgeProtection]}>
              <Text style={styles.badgePillText}>🛡️ 4-WAY VISIBILITY MASKING ENGINE</Text>
            </View>
          </View>
          <Text style={styles.title}>ERP Settings & Confidential Data Access Control</Text>
          <Text style={styles.subTitle}>
            Super Admin centralized management: grant or restrict access to <Text style={{ fontWeight: '800', color: Colors.accentTeal }}>Client Names</Text>, <Text style={{ fontWeight: '800', color: Colors.successBright }}>Quotation Amounts</Text>, <Text style={{ fontWeight: '800', color: '#f59e0b' }}>Both</Text>, or <Text style={{ fontWeight: '800', color: '#f87171' }}>None</Text> across all Quotations, Orders, and Dashboards.
          </Text>
        </View>

        {isSuperAdmin && (
          <View style={styles.bannerActionGroup}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleResetDefaults}>
              <Text style={styles.btnSecondaryText}>🔄 Reset Role Defaults</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <View
          style={[
            styles.toastBox,
            toastMessage.type === 'success'
              ? styles.toastSuccess
              : toastMessage.type === 'warning'
              ? styles.toastWarning
              : styles.toastInfo,
          ]}
        >
          <Text style={styles.toastText}>
            {toastMessage.type === 'success' ? '✅ ' : toastMessage.type === 'warning' ? '⚠️ ' : 'ℹ️ '}
            {toastMessage.text}
          </Text>
        </View>
      )}

      {/* 4-Way Access Summary Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, presetFilter === 'BOTH' && styles.statCardActive]}
          onPress={() => setPresetFilter(presetFilter === 'BOTH' ? 'ALL' : 'BOTH')}
        >
          <View style={[styles.statIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Text style={styles.statIcon}>🌟</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statValue, { color: Colors.successBright }]}>{bothCount}</Text>
            <Text style={styles.statLabel}>Both (Full Access)</Text>
            <Text style={styles.statSub}>Client Name & Quotation Amount</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, presetFilter === 'NAME_ONLY' && styles.statCardActive]}
          onPress={() => setPresetFilter(presetFilter === 'NAME_ONLY' ? 'ALL' : 'NAME_ONLY')}
        >
          <View style={[styles.statIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Text style={styles.statIcon}>🏢</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statValue, { color: Colors.accentTeal }]}>{nameOnlyCount}</Text>
            <Text style={styles.statLabel}>Name Only</Text>
            <Text style={styles.statSub}>Amount is Masked</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, presetFilter === 'AMOUNT_ONLY' && styles.statCardActive]}
          onPress={() => setPresetFilter(presetFilter === 'AMOUNT_ONLY' ? 'ALL' : 'AMOUNT_ONLY')}
        >
          <View style={[styles.statIconBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <Text style={styles.statIcon}>💰</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statValue, { color: '#c084fc' }]}>{amountOnlyCount}</Text>
            <Text style={styles.statLabel}>Amount Only</Text>
            <Text style={styles.statSub}>Client Name is Masked</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, presetFilter === 'NONE' && styles.statCardActive]}
          onPress={() => setPresetFilter(presetFilter === 'NONE' ? 'ALL' : 'NONE')}
        >
          <View style={[styles.statIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Text style={styles.statIcon}>🔒</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statValue, { color: '#f87171' }]}>{noneCount}</Text>
            <Text style={styles.statLabel}>None (Restricted)</Text>
            <Text style={styles.statSub}>Both Name & Amount Masked</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'USER_ACCESS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('USER_ACCESS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'USER_ACCESS' && styles.tabBtnTextActive]}>
            👥 User Visibility Matrix ({totalUsers})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'CLIENT_DIRECTORY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('CLIENT_DIRECTORY')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'CLIENT_DIRECTORY' && styles.tabBtnTextActive]}>
            📇 Client Details Directory ({totalClientsCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'SIMULATOR' && styles.tabBtnActive]}
          onPress={() => setActiveTab('SIMULATOR')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'SIMULATOR' && styles.tabBtnTextActive]}>
            🧪 Live Permission & Masking Simulator
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'AUDIT_LOGS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('AUDIT_LOGS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'AUDIT_LOGS' && styles.tabBtnTextActive]}>
            📜 Security Audit Trail
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: USER VISIBILITY ACCESS MATRIX */}
      {activeTab === 'USER_ACCESS' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={styles.cardTitle}>Super Admin Granular Visibility Matrix</Text>
              <Text style={styles.cardSubTitle}>
                Use the direct preset buttons (<Text style={{ fontWeight: '800', color: Colors.successBright }}>🌟 Both</Text>, <Text style={{ fontWeight: '800', color: Colors.accentTeal }}>🏢 Name Only</Text>, <Text style={{ fontWeight: '800', color: '#c084fc' }}>💰 Amount Only</Text>, <Text style={{ fontWeight: '800', color: '#f87171' }}>🔒 None</Text>) or individual feature toggles to configure what each user can see.
              </Text>
            </View>

            {isSuperAdmin && (
              <View style={styles.bulkPresetBar}>
                <Text style={styles.bulkLabel}>Bulk Apply to All Users:</Text>
                <View style={styles.bulkBtnGroup}>
                  <TouchableOpacity style={[styles.bulkBtn, styles.bulkBtnBoth]} onPress={() => handleBulkPreset('BOTH')}>
                    <Text style={styles.bulkBtnText}>🌟 All to Both</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bulkBtn, styles.bulkBtnName]} onPress={() => handleBulkPreset('NAME_ONLY')}>
                    <Text style={styles.bulkBtnText}>🏢 All to Name Only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bulkBtn, styles.bulkBtnAmount]} onPress={() => handleBulkPreset('AMOUNT_ONLY')}>
                    <Text style={styles.bulkBtnText}>💰 All to Amount Only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bulkBtn, styles.bulkBtnNone]} onPress={() => handleBulkPreset('NONE')}>
                    <Text style={styles.bulkBtnText}>🔒 All to None</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Search & Preset Filters */}
          <View style={styles.filterBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search users by name, username, email, department..."
              placeholderTextColor="#94a3b8"
              value={userSearch}
              onChangeText={setUserSearch}
            />

            <View style={styles.filterChipGroup}>
              <Text style={styles.filterLabel}>Preset:</Text>
              {(['ALL', 'BOTH', 'NAME_ONLY', 'AMOUNT_ONLY', 'NONE'] as const).map((filter) => {
                const isSelected = presetFilter === filter;
                const labels: Record<typeof filter, string> = {
                  ALL: `All (${totalUsers})`,
                  BOTH: `🌟 Both (${bothCount})`,
                  NAME_ONLY: `🏢 Name (${nameOnlyCount})`,
                  AMOUNT_ONLY: `💰 Amount (${amountOnlyCount})`,
                  NONE: `🔒 None (${noneCount})`,
                };
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setPresetFilter(filter)}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {labels[filter]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Role Filter Chips */}
          <View style={styles.roleFilterRow}>
            <Text style={styles.filterLabel}>Department Role:</Text>
            <TouchableOpacity
              style={[styles.roleChip, roleFilter === 'ALL' && styles.roleChipActive]}
              onPress={() => setRoleFilter('ALL')}
            >
              <Text style={[styles.roleChipText, roleFilter === 'ALL' && styles.roleChipTextActive]}>All Roles</Text>
            </TouchableOpacity>
            {Object.keys(ROLE_DEPARTMENTS).map((rKey) => {
              const r = rKey as Role;
              const isSelected = roleFilter === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, isSelected && styles.roleChipActive]}
                  onPress={() => setRoleFilter(r)}
                >
                  <Text style={[styles.roleChipText, isSelected && styles.roleChipTextActive]}>
                    {ROLE_DEPARTMENTS[r].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Users Table / Matrix */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.table}>
              <View style={styles.thRow}>
                <Text style={[styles.th, { width: 170 }]}>User Profile</Text>
                <Text style={[styles.th, { width: 150 }]}>Role & Dept</Text>
                <Text style={[styles.th, { width: 170 }]}>Email / Account</Text>
                <Text style={[styles.th, { width: 180 }]}>Current Access Level</Text>
                <Text style={[styles.th, { width: 330 }]}>Super Admin Quick Preset Buttons</Text>
                <Text style={[styles.th, { width: 230 }]}>Fine-Grained Feature Toggles</Text>
              </View>

              {filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found matching current filter criteria.</Text>
                </View>
              ) : (
                filteredUsers.map((u) => {
                  const preset = getUserPreset(u);
                  const hasClient = hasClientAccess(u);
                  const hasAmt = hasAmountAccess(u);
                  const isOwner = u.role === 'SUPER_ADMIN';
                  const roleMeta = ROLE_DEPARTMENTS[u.role] || { label: u.role, department: 'General', color: '#64748b' };

                  return (
                    <View key={u.id} style={styles.trRow}>
                      {/* User Profile */}
                      <View style={{ width: 170, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[styles.userAvatar, { backgroundColor: roleMeta.color }]}>
                          <Text style={styles.userAvatarText}>
                            {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.userName} numberOfLines={1}>
                            {u.name}
                          </Text>
                          <Text style={styles.userSub}>@{u.username}</Text>
                        </View>
                      </View>

                      {/* Role & Department */}
                      <View style={{ width: 150 }}>
                        <View style={[styles.roleTag, { borderColor: roleMeta.color }]}>
                          <Text style={[styles.roleTagText, { color: roleMeta.color }]}>{roleMeta.label}</Text>
                        </View>
                        <Text style={styles.userDept} numberOfLines={1}>
                          {roleMeta.department}
                        </Text>
                      </View>

                      {/* Email */}
                      <View style={{ width: 170 }}>
                        <Text style={styles.userEmail} numberOfLines={1}>
                          {u.email}
                        </Text>
                        <Text style={styles.userStatusActive}>
                          {u.isActive ? '● Account Active' : '○ Deactivated'}
                        </Text>
                      </View>

                      {/* Current Preset Badge */}
                      <View style={{ width: 180 }}>
                        {preset === 'BOTH' ? (
                          <View style={styles.presetBadgeBoth}>
                            <Text style={styles.presetBadgeBothText}>🌟 BOTH (FULL ACCESS)</Text>
                            <Text style={styles.presetBadgeBothSub}>Client Name & Quotation Amount</Text>
                          </View>
                        ) : preset === 'NAME_ONLY' ? (
                          <View style={styles.presetBadgeName}>
                            <Text style={styles.presetBadgeNameText}>🏢 NAME ONLY</Text>
                            <Text style={styles.presetBadgeNameSub}>Client visible • Amount masked</Text>
                          </View>
                        ) : preset === 'AMOUNT_ONLY' ? (
                          <View style={styles.presetBadgeAmount}>
                            <Text style={styles.presetBadgeAmountText}>💰 AMOUNT ONLY</Text>
                            <Text style={styles.presetBadgeAmountSub}>Amount visible • Client masked</Text>
                          </View>
                        ) : (
                          <View style={styles.presetBadgeNone}>
                            <Text style={styles.presetBadgeNoneText}>🔒 NONE (RESTRICTED)</Text>
                            <Text style={styles.presetBadgeNoneSub}>Both Name & Amount masked</Text>
                          </View>
                        )}
                      </View>

                      {/* Quick 4-Way Preset Buttons */}
                      <View style={{ width: 330, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {isOwner ? (
                          <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>👑 Permanent Full Access (Owner)</Text>
                          </View>
                        ) : isSuperAdmin ? (
                          <>
                            {/* Preset: Both */}
                            <TouchableOpacity
                              style={[styles.btnPresetOption, preset === 'BOTH' && styles.btnPresetActiveBoth]}
                              onPress={() => handleApplyPreset(u, 'BOTH')}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.btnPresetOptionText, preset === 'BOTH' && styles.btnPresetActiveText]}>
                                🌟 Both
                              </Text>
                            </TouchableOpacity>

                            {/* Preset: Name Only */}
                            <TouchableOpacity
                              style={[styles.btnPresetOption, preset === 'NAME_ONLY' && styles.btnPresetActiveName]}
                              onPress={() => handleApplyPreset(u, 'NAME_ONLY')}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.btnPresetOptionText, preset === 'NAME_ONLY' && styles.btnPresetActiveText]}>
                                🏢 Name Only
                              </Text>
                            </TouchableOpacity>

                            {/* Preset: Amount Only */}
                            <TouchableOpacity
                              style={[styles.btnPresetOption, preset === 'AMOUNT_ONLY' && styles.btnPresetActiveAmount]}
                              onPress={() => handleApplyPreset(u, 'AMOUNT_ONLY')}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.btnPresetOptionText, preset === 'AMOUNT_ONLY' && styles.btnPresetActiveText]}>
                                💰 Amount Only
                              </Text>
                            </TouchableOpacity>

                            {/* Preset: None */}
                            <TouchableOpacity
                              style={[styles.btnPresetOption, preset === 'NONE' && styles.btnPresetActiveNone]}
                              onPress={() => handleApplyPreset(u, 'NONE')}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.btnPresetOptionText, preset === 'NONE' && styles.btnPresetActiveText]}>
                                🔒 None
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <View style={styles.disabledActionBadge}>
                            <Text style={styles.disabledActionText}>🔒 Super Admin Only</Text>
                          </View>
                        )}
                      </View>

                      {/* Independent Feature Toggles */}
                      <View style={{ width: 230, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {isOwner ? (
                          <Text style={{ fontSize: 11, color: '#94a3b8' }}>Unrestricted</Text>
                        ) : isSuperAdmin ? (
                          <>
                            {/* Client Name Toggle */}
                            <TouchableOpacity
                              style={[styles.featureTogglePill, hasClient ? styles.toggleOnClient : styles.toggleOff]}
                              onPress={() => handleToggleClient(u)}
                            >
                              <Text style={[styles.featureToggleText, hasClient ? styles.toggleOnText : styles.toggleOffText]}>
                                🏢 {hasClient ? 'Name: 🔓 On' : 'Name: 🔒 Off'}
                              </Text>
                            </TouchableOpacity>

                            {/* Quotation Amount Toggle */}
                            <TouchableOpacity
                              style={[styles.featureTogglePill, hasAmt ? styles.toggleOnAmount : styles.toggleOff]}
                              onPress={() => handleToggleAmount(u)}
                            >
                              <Text style={[styles.featureToggleText, hasAmt ? styles.toggleOnText : styles.toggleOffText]}>
                                💰 {hasAmt ? 'Amount: 🔓 On' : 'Amount: 🔒 Off'}
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <Text style={{ fontSize: 11, color: '#94a3b8' }}>Protected</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* TAB 2: REGISTERED CLIENT DIRECTORY */}
      {activeTab === 'CLIENT_DIRECTORY' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Registered Client Directory & Protected Assets</Text>
              <Text style={styles.cardSubTitle}>
                Central customer repository. Visibility of these confidential records is controlled by the Super Admin matrix above.
              </Text>
            </View>

            <View style={styles.clientCountTag}>
              <Text style={styles.clientCountTagText}>Total: {totalClientsCount} Registered Clients</Text>
            </View>
          </View>

          {/* Client Search */}
          <View style={styles.filterBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search client code, company name, contact person, GST number..."
              placeholderTextColor="#94a3b8"
              value={clientSearch}
              onChangeText={setClientSearch}
            />
          </View>

          {/* Client Directory Table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.table}>
              <View style={styles.thRow}>
                <Text style={[styles.th, { width: 110 }]}>Client Code</Text>
                <Text style={[styles.th, { width: 230 }]}>Company Legal Name</Text>
                <Text style={[styles.th, { width: 150 }]}>Key Contact Person</Text>
                <Text style={[styles.th, { width: 130 }]}>Phone</Text>
                <Text style={[styles.th, { width: 190 }]}>Official Email</Text>
                <Text style={[styles.th, { width: 150 }]}>GST / Tax ID</Text>
                <Text style={[styles.th, { width: 150 }]}>Actions & Org Tree</Text>
              </View>

              {filteredClients.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No clients found matching search query.</Text>
                </View>
              ) : (
                filteredClients.map((c) => {
                  const clientOrdersCount = orders.filter((o) => o.clientCode === c.clientCode).length;

                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.trRow}
                      onPress={() => setSelectedClientForModal(c)}
                      activeOpacity={0.85}
                    >
                      <View style={{ width: 110 }}>
                        <Text style={styles.tdHighlight}>{c.clientCode}</Text>
                        <Text style={styles.tdSubSmall}>{clientOrdersCount} Orders</Text>
                      </View>

                      <View style={{ width: 230 }}>
                        <Text style={styles.tdBold}>{c.companyName}</Text>
                        <Text style={styles.tdSubSmall}>{c.industry || 'Industrial Flanges & EPC'}</Text>
                      </View>

                      <View style={{ width: 150 }}>
                        <Text style={styles.td}>{c.contactName || 'Primary Contact'}</Text>
                        <Text style={styles.tdSubSmall}>{c.address ? c.address.slice(0, 24) + '...' : 'Plant Location'}</Text>
                      </View>

                      <Text style={[styles.td, { width: 130 }]}>{c.contactNo}</Text>
                      <Text style={[styles.td, { width: 190 }]}>{c.email || 'N/A'}</Text>
                      <Text style={[styles.tdHighlight, { width: 150, color: Colors.accentTeal }]}>
                        {c.gstNumber || 'N/A'}
                      </Text>

                      <View style={{ width: 150, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                          style={styles.btnViewOrg}
                          onPress={() => setSelectedClientForModal(c)}
                        >
                          <Text style={styles.btnViewOrgText}>🌳 View Org Tree</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Confidentiality Notice */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>🛡️ Security & Confidentiality Architecture</Text>
            <Text style={styles.infoBoxText}>
              • Unauthorized users will see "🔒 MASKED (Confidential)" in place of Company Name, Phone, and Email.
            </Text>
            <Text style={styles.infoBoxText}>
              • Unauthorized users will see "🔒 MASKED" in place of Quotation Amounts and Commercial Values.
            </Text>
          </View>
        </View>
      )}

      {/* TAB 3: LIVE EXPERIENCE & MASKING SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>🧪 Live Experience & Confidentiality Simulator</Text>
              <Text style={styles.cardSubTitle}>
                Select any system user to preview exactly how Quotation Amounts, Client Names, and KPIs appear in their interface.
              </Text>
            </View>
          </View>

          {/* User Selector Dropdown / Chips */}
          <View style={styles.simulatorPickerRow}>
            <Text style={styles.simulatorPickerLabel}>Select User to Simulate:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {users.map((u) => {
                  const isSelected = u.id === simulatedUserId;
                  const p = getUserPreset(u);
                  const icon = p === 'BOTH' ? '🌟' : p === 'NAME_ONLY' ? '🏢' : p === 'AMOUNT_ONLY' ? '💰' : '🔒';
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.simUserChip, isSelected && styles.simUserChipSelected]}
                      onPress={() => setSimulatedUserId(u.id)}
                    >
                      <Text style={[styles.simUserChipText, isSelected && styles.simUserChipTextSelected]}>
                        {icon} {u.name} ({u.role})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Simulation Comparison View */}
          {simulatedUser && (
            <View style={styles.simulatorComparisonRow}>
              {/* Left Column: Simulated User Status & Quick Control */}
              <View style={styles.simCardUser}>
                <View style={styles.simUserHeader}>
                  <View style={[styles.userAvatarLarge, { backgroundColor: ROLE_DEPARTMENTS[simulatedUser.role]?.color || '#64748b' }]}>
                    <Text style={styles.userAvatarLargeText}>
                      {simulatedUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.simUserName}>{simulatedUser.name}</Text>
                    <Text style={styles.simUserRole}>Role: {ROLE_DEPARTMENTS[simulatedUser.role]?.label}</Text>
                    <Text style={styles.simUserDept}>Dept: {ROLE_DEPARTMENTS[simulatedUser.role]?.department}</Text>
                  </View>
                </View>

                <View style={styles.simDivider} />

                {/* Preset Status */}
                <View style={styles.simStatusRow}>
                  <Text style={styles.simStatusLabel}>Active Preset:</Text>
                  <View
                    style={[
                      styles.simStatusBadge,
                      simulatedPreset === 'BOTH'
                        ? styles.badgeAllowedBg
                        : simulatedPreset === 'NAME_ONLY'
                        ? styles.badgeNameBg
                        : simulatedPreset === 'AMOUNT_ONLY'
                        ? styles.badgeAmountBg
                        : styles.badgeRestrictedBg,
                    ]}
                  >
                    <Text
                      style={[
                        styles.simStatusBadgeText,
                        simulatedPreset === 'BOTH'
                          ? styles.badgeAllowedText
                          : simulatedPreset === 'NAME_ONLY'
                          ? styles.badgeNameText
                          : simulatedPreset === 'AMOUNT_ONLY'
                          ? styles.badgeAmountText
                          : styles.badgeRestrictedText,
                      ]}
                    >
                      {simulatedPreset === 'BOTH'
                        ? '🌟 BOTH (Full Access)'
                        : simulatedPreset === 'NAME_ONLY'
                        ? '🏢 NAME ONLY (Amount Masked)'
                        : simulatedPreset === 'AMOUNT_ONLY'
                        ? '💰 AMOUNT ONLY (Client Masked)'
                        : '🔒 NONE (Both Masked)'}
                    </Text>
                  </View>
                </View>

                {/* Granular Breakdown */}
                <View style={styles.simBreakdownCard}>
                  <View style={styles.simBreakdownRow}>
                    <Text style={styles.simBreakdownLbl}>🏢 Client Name & Contacts:</Text>
                    <Text style={[styles.simBreakdownVal, simulatedHasClient ? { color: Colors.successBright } : { color: '#f87171' }]}>
                      {simulatedHasClient ? '🔓 UNMASKED' : '🔒 MASKED'}
                    </Text>
                  </View>
                  <View style={styles.simBreakdownRow}>
                    <Text style={styles.simBreakdownLbl}>💰 Quotation Value & Pricing:</Text>
                    <Text style={[styles.simBreakdownVal, simulatedHasAmount ? { color: Colors.successBright } : { color: '#f87171' }]}>
                      {simulatedHasAmount ? '🔓 UNMASKED' : '🔒 MASKED'}
                    </Text>
                  </View>
                </View>

                {/* Interactive Preset Buttons right in simulator */}
                {isSuperAdmin && simulatedUser.role !== 'SUPER_ADMIN' && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.simControlLabel}>Quick Switch Preset for {simulatedUser.name}:</Text>
                    <View style={styles.simPresetButtonGroup}>
                      <TouchableOpacity
                        style={[styles.simPresetBtn, simulatedPreset === 'BOTH' && styles.btnPresetActiveBoth]}
                        onPress={() => handleApplyPreset(simulatedUser, 'BOTH')}
                      >
                        <Text style={styles.simPresetBtnText}>🌟 Both</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.simPresetBtn, simulatedPreset === 'NAME_ONLY' && styles.btnPresetActiveName]}
                        onPress={() => handleApplyPreset(simulatedUser, 'NAME_ONLY')}
                      >
                        <Text style={styles.simPresetBtnText}>🏢 Name Only</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.simPresetBtn, simulatedPreset === 'AMOUNT_ONLY' && styles.btnPresetActiveAmount]}
                        onPress={() => handleApplyPreset(simulatedUser, 'AMOUNT_ONLY')}
                      >
                        <Text style={styles.simPresetBtnText}>💰 Amount Only</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.simPresetBtn, simulatedPreset === 'NONE' && styles.btnPresetActiveNone]}
                        onPress={() => handleApplyPreset(simulatedUser, 'NONE')}
                      >
                        <Text style={styles.simPresetBtnText}>🔒 None</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Right Column: Live Data Previews (Quotations Table & Details View) */}
              <View style={styles.simCardPreview}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>
                    👁️ What {simulatedUser.name} Sees in Quotations:
                  </Text>
                  <View
                    style={[
                      styles.previewBadge,
                      simulatedPreset === 'BOTH'
                        ? styles.badgeAllowedBg
                        : simulatedPreset === 'NAME_ONLY'
                        ? styles.badgeNameBg
                        : simulatedPreset === 'AMOUNT_ONLY'
                        ? styles.badgeAmountBg
                        : styles.badgeRestrictedBg,
                    ]}
                  >
                    <Text
                      style={[
                        styles.previewBadgeText,
                        simulatedPreset === 'BOTH'
                          ? styles.badgeAllowedText
                          : simulatedPreset === 'NAME_ONLY'
                          ? styles.badgeNameText
                          : simulatedPreset === 'AMOUNT_ONLY'
                          ? styles.badgeAmountText
                          : styles.badgeRestrictedText,
                      ]}
                    >
                      {simulatedPreset === 'BOTH'
                        ? '🌟 Full Visibility'
                        : simulatedPreset === 'NAME_ONLY'
                        ? '🏢 Amount Hidden'
                        : simulatedPreset === 'AMOUNT_ONLY'
                        ? '💰 Name Hidden'
                        : '🔒 Fully Masked'}
                    </Text>
                  </View>
                </View>

                {/* Sample Quotation Card Live Preview */}
                <View style={styles.mockOrderCard}>
                  <View style={styles.mockOrderHeader}>
                    <Text style={styles.mockOrderNumber}>{sampleQuotation.quotationNumber}</Text>
                    <Text style={styles.mockOrderStage}>Status: Fully Converted</Text>
                  </View>

                  <View style={styles.mockFieldRow}>
                    <Text style={styles.mockFieldLabel}>Client Code:</Text>
                    <Text style={styles.mockFieldValueBold}>{sampleQuotation.clientCode} (Always visible for tracking)</Text>
                  </View>

                  <View style={styles.mockFieldRow}>
                    <Text style={styles.mockFieldLabel}>Company Name:</Text>
                    <Text
                      style={[
                        styles.mockFieldValueBold,
                        simulatedHasClient ? { color: Colors.accentTeal } : styles.maskedFieldText,
                      ]}
                    >
                      {simulatedHasClient ? sampleQuotation.companyName : '🔒 MASKED (Confidential)'}
                    </Text>
                  </View>

                  <View style={styles.mockFieldRow}>
                    <Text style={styles.mockFieldLabel}>Contact & Phone:</Text>
                    <Text
                      style={[
                        styles.mockFieldValue,
                        simulatedHasClient ? { color: Colors.textLight } : styles.maskedFieldText,
                      ]}
                    >
                      {simulatedHasClient
                        ? `${sampleQuotation.contactPerson} (${sampleQuotation.mobileNumber})`
                        : '🔒 MASKED'}
                    </Text>
                  </View>

                  <View style={styles.mockFieldRow}>
                    <Text style={styles.mockFieldLabel}>Quotation Value:</Text>
                    <Text
                      style={[
                        styles.mockFieldValueBold,
                        simulatedHasAmount ? { color: Colors.successBright } : styles.maskedFieldText,
                      ]}
                    >
                      {simulatedHasAmount ? formatCurrency(sampleQuotation.quotationAmount) : '🔒 MASKED'}
                    </Text>
                  </View>

                  <View style={styles.mockFieldRow}>
                    <Text style={styles.mockFieldLabel}>Expected Order Value:</Text>
                    <Text
                      style={[
                        styles.mockFieldValue,
                        simulatedHasAmount ? { color: Colors.textLight } : styles.maskedFieldText,
                      ]}
                    >
                      {simulatedHasAmount ? formatCurrency(sampleQuotation.expectedOrderValue || sampleQuotation.quotationAmount) : '🔒 MASKED'}
                    </Text>
                  </View>

                  <View style={styles.mockFieldRow}>
                    <Text style={styles.mockFieldLabel}>Converted Value:</Text>
                    <Text
                      style={[
                        styles.mockFieldValue,
                        simulatedHasAmount ? { color: Colors.successBright } : styles.maskedFieldText,
                      ]}
                    >
                      {simulatedHasAmount ? formatCurrency(sampleQuotation.convertedOrderValue || 0) : '🔒 MASKED'}
                    </Text>
                  </View>
                </View>

                {/* Sample KPI Cards Live Preview */}
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', marginBottom: 6 }}>
                    📊 Sales KPI Card Preview for {simulatedUser.name}:
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={styles.simKpiMiniCard}>
                      <Text style={styles.simKpiMiniLbl}>Total Value</Text>
                      <Text style={[styles.simKpiMiniVal, !simulatedHasAmount && { color: '#f87171' }]}>
                        {simulatedHasAmount ? '₹22,50,000' : '🔒 MASKED'}
                      </Text>
                    </View>
                    <View style={styles.simKpiMiniCard}>
                      <Text style={styles.simKpiMiniLbl}>Converted</Text>
                      <Text style={[styles.simKpiMiniVal, simulatedHasAmount ? { color: Colors.successBright } : { color: '#f87171' }]}>
                        {simulatedHasAmount ? '₹11,80,000' : '🔒 MASKED'}
                      </Text>
                    </View>
                    <View style={styles.simKpiMiniCard}>
                      <Text style={styles.simKpiMiniLbl}>Lost Value</Text>
                      <Text style={[styles.simKpiMiniVal, simulatedHasAmount ? { color: Colors.industrialOrange } : { color: '#f87171' }]}>
                        {simulatedHasAmount ? '₹1,50,000' : '🔒 MASKED'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* TAB 4: SECURITY & PERMISSIONS AUDIT TRAIL */}
      {activeTab === 'AUDIT_LOGS' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>📜 Security & Access Control Audit Trail</Text>
              <Text style={styles.cardSubTitle}>
                Immutable log of all user authentication events, visibility modifications, preset assignments, and Super Admin authorization actions.
              </Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={[styles.th, { width: 160 }]}>Timestamp</Text>
              <Text style={[styles.th, { width: 180 }]}>Event Type</Text>
              <Text style={[styles.th, { width: 150 }]}>Actor (Admin)</Text>
              <Text style={[styles.th, { width: 350 }]}>Activity Details</Text>
            </View>

            {authAuditLogs.map((log) => (
              <View key={log.id} style={styles.trRow}>
                <Text style={[styles.td, { width: 160, fontSize: 11 }]}>
                  {new Date(log.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Text>

                <View style={{ width: 180 }}>
                  <View
                    style={[
                      styles.eventTag,
                      log.event.includes('PRESET')
                        ? { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }
                        : log.event.includes('ACCESS') || log.event.includes('PERMISSION')
                        ? { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: Colors.accentTeal }
                        : log.event.includes('LOGIN')
                        ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: Colors.successBright }
                        : { backgroundColor: 'rgba(148, 163, 184, 0.15)', borderColor: '#64748b' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventTagText,
                        log.event.includes('PRESET')
                          ? { color: '#f59e0b' }
                          : log.event.includes('ACCESS') || log.event.includes('PERMISSION')
                          ? { color: Colors.accentTeal }
                          : log.event.includes('LOGIN')
                          ? { color: Colors.successBright }
                          : { color: '#94a3b8' },
                      ]}
                    >
                      {log.event.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <View style={{ width: 150 }}>
                  <Text style={styles.tdBold}>{log.username || 'System'}</Text>
                  <Text style={styles.tdSubSmall}>{log.role || 'Super Admin'}</Text>
                </View>

                <Text style={[styles.td, { width: 350, color: Colors.textLight }]}>{log.details}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBanner: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeSuperAdmin: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  badgeAdmin: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
  },
  badgeProtection: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: Colors.accentTeal,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Colors.textLight,
  },
  title: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subTitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  bannerActionGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  btnSecondaryText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  toastBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.successBright,
  },
  toastWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  toastInfo: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: Colors.accentTeal,
  },
  toastText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.sm,
    cursor: 'pointer' as any,
  },
  statCardActive: {
    borderColor: Colors.accentTeal,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  statIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  statSub: {
    color: '#94a3b8',
    fontSize: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    padding: 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 16,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.accentTeal,
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#12202A',
    fontWeight: '900',
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
    marginBottom: 24,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  cardTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubTitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  bulkPresetBar: {
    alignItems: 'flex-end',
    gap: 6,
  },
  bulkLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  bulkBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  bulkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  bulkBtnBoth: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.successBright,
  },
  bulkBtnName: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: Colors.accentTeal,
  },
  bulkBtnAmount: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#c084fc',
  },
  bulkBtnNone: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  bulkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textLight,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 260,
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterChipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color:  '#12202A',
    fontWeight: '900',
  },
  roleFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  roleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: Colors.accentTeal,
  },
  roleChipText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  table: {
    minWidth: 1250,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  th: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  userName: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  userSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 2,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  userDept: {
    color: '#94a3b8',
    fontSize: 11,
  },
  userEmail: {
    color: Colors.textLight,
    fontSize: 12,
  },
  userStatusActive: {
    color: Colors.successBright,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  // Preset Badges
  presetBadgeBoth: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.successBright,
    alignSelf: 'flex-start',
  },
  presetBadgeBothText: {
    color: Colors.successBright,
    fontSize: 10,
    fontWeight: '800',
  },
  presetBadgeBothSub: {
    color: '#86efac',
    fontSize: 9,
    marginTop: 1,
  },
  presetBadgeName: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    alignSelf: 'flex-start',
  },
  presetBadgeNameText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '800',
  },
  presetBadgeNameSub: {
    color: '#7dd3fc',
    fontSize: 9,
    marginTop: 1,
  },
  presetBadgeAmount: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c084fc',
    alignSelf: 'flex-start',
  },
  presetBadgeAmountText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
  },
  presetBadgeAmountSub: {
    color: '#d8b4fe',
    fontSize: 9,
    marginTop: 1,
  },
  presetBadgeNone: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignSelf: 'flex-start',
  },
  presetBadgeNoneText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '800',
  },
  presetBadgeNoneSub: {
    color: '#fca5a5',
    fontSize: 9,
    marginTop: 1,
  },
  // Preset Action Buttons
  btnPresetOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  btnPresetOptionText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
  btnPresetActiveBoth: {
    backgroundColor: Colors.successBright,
    borderColor: Colors.successBright,
  },
  btnPresetActiveName: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  btnPresetActiveAmount: {
    backgroundColor: '#9333ea',
    borderColor: '#c084fc',
  },
  btnPresetActiveNone: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
  },
  btnPresetActiveText: {
    color: Colors.white,
    fontWeight: '900',
  },
  // Feature Toggles
  featureTogglePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleOnClient: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: Colors.accentTeal,
  },
  toggleOnAmount: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.successBright,
  },
  toggleOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  featureToggleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  toggleOnText: {
    color: Colors.textLight,
  },
  toggleOffText: {
    color: '#f87171',
  },
  ownerBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  ownerBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  disabledActionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  disabledActionText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  td: {
    color: Colors.textLight,
    fontSize: 12,
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  tdSubSmall: {
    color: '#94a3b8',
    fontSize: 10,
  },
  btnViewOrg: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  btnViewOrgText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
  },
  clientCountTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  clientCountTagText: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  infoBoxTitle: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoBoxText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  // Simulator Styles
  simulatorPickerRow: {
    marginBottom: 16,
  },
  simulatorPickerLabel: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  simUserChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  simUserChipSelected: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  simUserChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  simUserChipTextSelected: {
    color: '#12202A',
    fontWeight: '900',
  },
  simulatorComparisonRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  simCardUser: {
    flex: 1,
    minWidth: 290,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  simUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatarLarge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarLargeText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  simUserName: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  simUserRole: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  simUserDept: {
    color: '#94a3b8',
    fontSize: 11,
  },
  simDivider: {
    height: 1,
    backgroundColor: Colors.borderDark,
    marginVertical: 12,
  },
  simStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  simStatusLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  simStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeAllowedBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.successBright,
  },
  badgeAllowedText: {
    color: Colors.successBright,
  },
  badgeNameBg: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: Colors.accentTeal,
  },
  badgeNameText: {
    color: Colors.accentTeal,
  },
  badgeAmountBg: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#c084fc',
  },
  badgeAmountText: {
    color: '#c084fc',
  },
  badgeRestrictedBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  badgeRestrictedText: {
    color: '#f87171',
  },
  simStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  simBreakdownCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  simBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simBreakdownLbl: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  simBreakdownVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  simControlLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  simPresetButtonGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  simPresetBtn: {
    flex: 1,
    minWidth: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  simPresetBtnText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '800',
  },
  simCardPreview: {
    flex: 1.5,
    minWidth: 320,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mockOrderCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  mockOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  mockOrderNumber: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: '800',
  },
  mockOrderStage: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  mockFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mockFieldLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    width: 140,
  },
  mockFieldValue: {
    color: Colors.textLight,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  mockFieldValueBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  maskedFieldText: {
    color: '#f87171',
    fontWeight: '800',
  },
  simKpiMiniCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
  },
  simKpiMiniLbl: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
  simKpiMiniVal: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  // Audit Trail Styles
  eventTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  eventTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
