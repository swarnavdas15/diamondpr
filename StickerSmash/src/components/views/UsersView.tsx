import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Role, User } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface UsersViewProps {
  onOpenCreateUser?: () => void;
}

const ROLE_DEPARTMENTS: Record<Role, { label: string; department: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', department: 'Executive Management' },
  ADMIN: { label: 'Admin', department: 'Plant Operations' },
  SALES: { label: 'Sales Department', department: 'Commercial & Accounts' },
  PURCHASE: { label: 'Purchase Department', department: 'Procurement & Supply Chain' },
  PRODUCTION: { label: 'Production Department', department: 'Shop Floor & Machining' },
  QUALITY_TESTING: { label: 'Quality Testing', department: 'Inspection & QA' },
  DISPATCH: { label: 'Dispatch Department', department: 'Logistics & Shipment' },
};

export const UsersView: React.FC<UsersViewProps> = ({ onOpenCreateUser }) => {
  const { users, toggleUserStatus, updateUser, adminResetUserPassword, deleteUser, authAuditLogs, currentUser } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals State
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [editRole, setEditRole] = useState<Role>('PRODUCTION');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Reset Password Form State
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Helper: Get Last Login Timestamp from Audit Logs
  const getLastLogin = (user: User): string => {
    const userLog = authAuditLogs.find(
      (log) =>
        log.event === 'LOGIN_SUCCESS' &&
        ((log.username && user.username && log.username.toLowerCase() === user.username.toLowerCase()) ||
          (log.email && user.email && log.email.toLowerCase() === user.email.toLowerCase()))
    );
    if (userLog) {
      return new Date(userLog.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return user.createdAt
      ? new Date(user.createdAt).toLocaleDateString()
      : '2026-09-25 09:30 AM';
  };

  // Filter Users
  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'ACTIVE' && !u.isActive) return false;
    if (statusFilter === 'INACTIVE' && u.isActive) return false;
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const deptName = ROLE_DEPARTMENTS[u.role]?.department.toLowerCase() || '';
      const roleLabel = ROLE_DEPARTMENTS[u.role]?.label.toLowerCase() || '';
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        deptName.includes(q) ||
        roleLabel.includes(q)
      );
    }
    return true;
  });

  // Open Edit User Modal
  const handleOpenEdit = (user: User) => {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditMobile(user.mobileNumber || '');
    setEditEmpId(user.employeeId || '');
    setEditRole(user.role);
    setEditError('');
    setEditSuccess('');
  };

  // Submit Edit User
  const handleSaveEdit = async () => {
    if (!editUser) return;
    setEditError('');
    setEditSuccess('');

    if (!editName.trim()) {
      setEditError('Full Name is required.');
      return;
    }
    if (!editEmail.trim()) {
      setEditError('Email address is required.');
      return;
    }

    try {
      await updateUser(editUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        mobileNumber: editMobile.trim() || undefined,
        employeeId: editEmpId.trim() || undefined,
        role: editRole,
      });
      setEditSuccess('User details updated successfully.');
      setTimeout(() => {
        setEditUser(null);
        setEditSuccess('');
      }, 1200);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user.');
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPass = (user: User) => {
    setResetPassUser(user);
    setNewPass('');
    setConfirmPass('');
    setPassError('');
    setPassSuccess('');
  };

  // Submit Password Reset
  const handleSaveResetPass = async () => {
    if (!resetPassUser) return;
    setPassError('');
    setPassSuccess('');

    if (!newPass || newPass.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Passwords do not match.');
      return;
    }

    try {
      await adminResetUserPassword(resetPassUser.id, newPass);
      setPassSuccess(`Password reset successfully for ${resetPassUser.email || resetPassUser.name}.`);
      setTimeout(() => {
        setResetPassUser(null);
        setPassSuccess('');
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || 'Failed to reset password.');
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    return (Colors.roles as any)[role] || Colors.accentTeal;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: isMobile ? 84 : Spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Banner */}
      <View style={[styles.topBanner, isMobile && styles.topBannerMobile]}>
        <View style={{ flex: 1, paddingRight: isMobile ? 0 : Spacing.md, marginBottom: isMobile ? 10 : 0 }}>
          <Text style={styles.title}>User Directory & Role Access Management (RBAC)</Text>
          <Text style={styles.subTitle}>
            Manage system user accounts, department security roles, account activations, and password resets.
          </Text>
        </View>
        {onOpenCreateUser && isSuperAdmin && (
          <TouchableOpacity style={[styles.btnPurple, isMobile && { width: '100%', alignItems: 'center' }]} onPress={onOpenCreateUser}>
            <Text style={styles.btnText}>+ Create New User</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search & Filters Card */}
      <View style={[styles.card, isMobile && { padding: Spacing.md }]}>
        <View style={styles.filterRow}>
          {/* Search Box */}
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search user name, username, email, department, role, emp ID..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Status Filter */}
          <View style={[styles.filterGroup, isMobile && { width: '100%', marginTop: 8 }]}>
            <Text style={styles.filterLabel}>Status:</Text>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Department / Role Chips */}
        <View style={styles.roleFilterRow}>
          <Text style={styles.filterLabel}>Role / Department:</Text>
          <TouchableOpacity
            style={[styles.filterChip, roleFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setRoleFilter('ALL')}
          >
            <Text style={[styles.filterChipText, roleFilter === 'ALL' && styles.filterChipTextActive]}>All Roles</Text>
          </TouchableOpacity>

          {(Object.keys(ROLE_DEPARTMENTS) as Role[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
              onPress={() => setRoleFilter(r)}
            >
              <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>
                {r.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User List: Mobile Cards or Desktop Table */}
        {isMobile ? (
          <View style={styles.mobileCardList}>
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found matching search criteria.</Text>
              </View>
            ) : (
              filteredUsers.map((u) => {
                const deptInfo = ROLE_DEPARTMENTS[u.role] || { label: u.role, department: 'General' };
                const createdStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '2026-01-15';
                const lastLoginStr = getLastLogin(u);

                return (
                  <View key={u.id} style={styles.userCard}>
                    <View style={styles.userCardHeader}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.userCardName}>{u.name}</Text>
                        <Text style={styles.userCardUsername}>
                          @{u.username} {u.employeeId ? `• ID: ${u.employeeId}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(u.role) }]}>
                        <Text style={styles.roleBadgeText}>{u.role.replace('_', ' ')}</Text>
                      </View>
                    </View>

                    <View style={styles.userCardBody}>
                      <Text style={styles.userCardEmail}>✉️ {u.email}</Text>
                      <View style={styles.userCardMetaRow}>
                        <Text style={styles.userCardMeta}>🏢 {deptInfo.department}</Text>
                        <Text style={[styles.statusText, u.isActive ? styles.activeText : styles.inactiveText]}>
                          {u.isActive ? '● Active' : '○ Deactivated'}
                        </Text>
                      </View>
                      <View style={styles.userCardMetaRow}>
                        <Text style={styles.userCardSubMeta}>Last Login: {lastLoginStr}</Text>
                        <Text style={styles.userCardSubMeta}>Created: {createdStr}</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.userCardActions}>
                      <TouchableOpacity style={styles.actionBtnViewMobile} onPress={() => setViewUser(u)}>
                        <Text style={styles.actionBtnText}>👁 View</Text>
                      </TouchableOpacity>

                      {isSuperAdmin && (
                        <TouchableOpacity style={styles.actionBtnEditMobile} onPress={() => handleOpenEdit(u)}>
                          <Text style={styles.actionBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                      )}

                      {isSuperAdmin && u.role !== 'SUPER_ADMIN' && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtnToggleMobile, u.isActive ? styles.deactBg : styles.actBg]}
                            onPress={() => toggleUserStatus(u.id)}
                          >
                            <Text style={[styles.actionBtnText, u.isActive ? styles.deactText : styles.actText]}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtnToggleMobile, { backgroundColor: '#fee2e2', borderColor: '#f87171' }]}
                            onPress={() => setUserToDelete(u)}
                          >
                            <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {isSuperAdmin && (
                        <TouchableOpacity style={styles.actionBtnResetMobile} onPress={() => handleOpenResetPass(u)}>
                          <Text style={styles.actionBtnText}>🔑 Reset</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.thRow}>
                <Text style={[styles.th, { width: 160 }]}>Full Name</Text>
                <Text style={[styles.th, { width: 130 }]}>Username</Text>
                <Text style={[styles.th, { width: 180 }]}>Email Address</Text>
                <Text style={[styles.th, { width: 160 }]}>Department & Role</Text>
                <Text style={[styles.th, { width: 100 }]}>Account Status</Text>
                <Text style={[styles.th, { width: 140 }]}>Last Login</Text>
                <Text style={[styles.th, { width: 110 }]}>Created Date</Text>
                <Text style={[styles.th, { width: 220 }]}>Actions</Text>
              </View>

            {/* Table Body */}
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found matching search criteria.</Text>
              </View>
            ) : (
              filteredUsers.map((u) => {
                const deptInfo = ROLE_DEPARTMENTS[u.role] || { label: u.role, department: 'General' };
                const createdStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '2026-01-15';
                const lastLoginStr = getLastLogin(u);

                return (
                  <View key={u.id} style={styles.trRow}>
                    {/* Full Name */}
                    <View style={{ width: 160 }}>
                      <Text style={styles.tdBold}>{u.name}</Text>
                      {u.employeeId ? <Text style={styles.tdSub}>ID: {u.employeeId}</Text> : null}
                    </View>

                    {/* Username */}
                    <Text style={[styles.tdHighlight, { width: 130 }]}>{u.username}</Text>

                    {/* Email */}
                    <Text style={[styles.td, { width: 180 }]} numberOfLines={1}>
                      {u.email}
                    </Text>

                    {/* Role & Dept */}
                    <View style={{ width: 160 }}>
                      <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(u.role) }]}>
                        <Text style={styles.roleBadgeText}>{u.role.replace('_', ' ')}</Text>
                      </View>
                      <Text style={styles.deptSubText}>{deptInfo.department}</Text>
                    </View>

                    {/* Status */}
                    <View style={{ width: 100 }}>
                      <Text style={[styles.statusText, u.isActive ? styles.activeText : styles.inactiveText]}>
                        {u.isActive ? '● Active' : '○ Deactivated'}
                      </Text>
                    </View>

                    {/* Last Login */}
                    <Text style={[styles.tdSmall, { width: 140 }]}>{lastLoginStr}</Text>

                    {/* Created Date */}
                    <Text style={[styles.tdSmall, { width: 110 }]}>{createdStr}</Text>

                    {/* Actions */}
                    <View style={{ width: 220, flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                      {/* View */}
                      <TouchableOpacity style={styles.actionBtnView} onPress={() => setViewUser(u)}>
                        <Text style={styles.actionBtnText}>View</Text>
                      </TouchableOpacity>

                      {/* Edit (Super Admin) */}
                      {isSuperAdmin && (
                        <TouchableOpacity style={styles.actionBtnEdit} onPress={() => handleOpenEdit(u)}>
                          <Text style={styles.actionBtnText}>Edit</Text>
                        </TouchableOpacity>
                      )}

                      {/* Toggle Status (Super Admin) */}
                      {isSuperAdmin && u.role !== 'SUPER_ADMIN' && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtnToggle, u.isActive ? styles.deactBg : styles.actBg]}
                            onPress={() => toggleUserStatus(u.id)}
                          >
                            <Text style={[styles.actionBtnText, u.isActive ? styles.deactText : styles.actText]}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtnToggle, { backgroundColor: '#fee2e2', borderColor: '#f87171' }]}
                            onPress={() => setUserToDelete(u)}
                          >
                            <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Reset Password (Super Admin) */}
                      {isSuperAdmin && (
                        <TouchableOpacity style={styles.actionBtnReset} onPress={() => handleOpenResetPass(u)}>
                          <Text style={styles.actionBtnText}>Reset Pass</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
        )}
      </View>

      {/* MODAL 1: VIEW USER DETAILS */}
      {viewUser && (
        <Modal visible={!!viewUser} transparent animationType="fade" onRequestClose={() => setViewUser(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setViewUser(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Account Profile: {viewUser.name}</Text>
                <TouchableOpacity onPress={() => setViewUser(null)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name:</Text>
                  <Text style={styles.detailValBold}>{viewUser.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Username / User ID:</Text>
                  <Text style={styles.detailValHighlight}>{viewUser.username}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registered Email:</Text>
                  <Text style={styles.detailVal}>{viewUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mobile Number:</Text>
                  <Text style={styles.detailVal}>{viewUser.mobileNumber || 'Not Provided'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Employee ID:</Text>
                  <Text style={styles.detailVal}>{viewUser.employeeId || 'N/A'}</Text>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Security Role:</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(viewUser.role) }]}>
                    <Text style={styles.roleBadgeText}>{viewUser.role.replace('_', ' ')}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned Department:</Text>
                  <Text style={styles.detailVal}>{ROLE_DEPARTMENTS[viewUser.role]?.department}</Text>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Status:</Text>
                  <Text style={[styles.detailVal, { color: viewUser.isActive ? Colors.successBright : '#ef4444' }]}>
                    {viewUser.isActive ? 'Active (Allowed Login)' : 'Deactivated (Access Blocked)'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Login Recorded:</Text>
                  <Text style={styles.detailVal}>{getLastLogin(viewUser)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created Date:</Text>
                  <Text style={styles.detailVal}>
                    {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleString() : '2026-01-15'}
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setViewUser(null)}>
                <Text style={styles.closeModalBtnText}>Close Record</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* MODAL 2: EDIT USER DETAILS */}
      {editUser && (
        <Modal visible={!!editUser} transparent animationType="fade" onRequestClose={() => setEditUser(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditUser(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Super Admin: Edit User ({editUser.username})</Text>
                <TouchableOpacity onPress={() => setEditUser(null)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 440 }}>
                {editError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {editError}</Text>
                  </View>
                ) : null}
                {editSuccess ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>✅ {editSuccess}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} />

                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput style={styles.modalInput} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" />

                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput style={styles.modalInput} value={editMobile} onChangeText={setEditMobile} keyboardType="phone-pad" />

                <Text style={styles.inputLabel}>Employee ID</Text>
                <TextInput style={styles.modalInput} value={editEmpId} onChangeText={setEditEmpId} />

                <Text style={styles.inputLabel}>Role & Department Access</Text>
                <View style={styles.roleGrid}>
                  {(Object.keys(ROLE_DEPARTMENTS) as Role[]).map((r) => {
                    const isSel = editRole === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleSelectChip, isSel && styles.roleSelectChipActive]}
                        onPress={() => setEditRole(r)}
                      >
                        <Text style={[styles.roleSelectText, isSel && styles.roleSelectTextActive]}>
                          {ROLE_DEPARTMENTS[r].label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                  <Text style={styles.saveBtnText}>✓ Save User Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* MODAL 3: RESET USER PASSWORD */}
      {resetPassUser && (
        <Modal visible={!!resetPassUser} transparent animationType="fade" onRequestClose={() => setResetPassUser(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setResetPassUser(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reset Password: {resetPassUser.username}</Text>
                <TouchableOpacity onPress={() => setResetPassUser(null)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: Spacing.md }}>
                {passError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {passError}</Text>
                  </View>
                ) : null}
                {passSuccess ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>✅ {passSuccess}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>New Password (Min 6 characters) *</Text>
                <TextInput
                  style={styles.modalInput}
                  secureTextEntry
                  placeholder="Enter new password"
                  placeholderTextColor="#94a3b8"
                  value={newPass}
                  onChangeText={setNewPass}
                />

                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <TextInput
                  style={styles.modalInput}
                  secureTextEntry
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveResetPass}>
                  <Text style={styles.saveBtnText}>🔑 Assign New Password</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
      {/* MODAL 4: DELETE CONFIRMATION */}
      {userToDelete && (
        <Modal visible={!!userToDelete} transparent animationType="fade" onRequestClose={() => setUserToDelete(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setUserToDelete(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Confirm Deletion</Text>
                <TouchableOpacity onPress={() => setUserToDelete(null)}>
                  <Text style={styles.closeBtnText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: Spacing.md, paddingBottom: Spacing.sm }}>
                <View style={{ backgroundColor: '#fee2e2', padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
                  <Text style={{ color: '#991b1b', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 4 }}>
                    Danger Zone
                  </Text>
                  <Text style={{ color: '#7f1d1d', textAlign: 'center', fontSize: 14 }}>
                    Are you absolutely sure you want to delete <Text style={{fontWeight: 'bold'}}>{userToDelete.name}</Text> (<Text style={{fontStyle: 'italic'}}>{userToDelete.email}</Text>)?
                  </Text>
                  <Text style={{ color: '#7f1d1d', textAlign: 'center', fontSize: 13, marginTop: 8, opacity: 0.8 }}>
                    This action cannot be undone.
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDark, alignItems: 'center' }}
                    onPress={() => setUserToDelete(null)}
                  >
                    <Text style={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: '#dc2626', alignItems: 'center' }}
                    onPress={async () => {
                      try {
                        await deleteUser(userToDelete.id);
                        setUserToDelete(null);
                      } catch (err: any) {
                        alert(err.message || 'Failed to delete');
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Yes, Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
    padding: Spacing.px18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
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
  btnPurple: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.px14,
    paddingVertical: Spacing.px10,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  btnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 260,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  filterLabel: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  filterChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.px6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  filterChipText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  roleFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  table: {
    minWidth: 1120,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: Spacing.px6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  th: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingVertical: Spacing.px10,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  tdSub: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  td: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  tdSmall: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  roleBadge: {
    paddingHorizontal: Spacing.px6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  deptSubText: {
    color: Colors.textSubtle,
    fontSize: 9,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeText: {
    color: Colors.successBright,
  },
  inactiveText: {
    color: Colors.industrialOrange,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  actionBtnView: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  actionBtnEdit: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: '#eab308',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  actionBtnToggle: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  deactBg: {
    backgroundColor: 'rgba(179, 75, 32, 0.15)',
    borderColor: Colors.industrialOrange,
  },
  actBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.successBright,
  },
  deactText: {
    color: Colors.industrialOrange,
  },
  actText: {
    color: Colors.successBright,
  },
  actionBtnReset: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  actionBtnText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    maxHeight: '90%',
    width: '100%',
    maxWidth: 540,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
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
    paddingBottom: Spacing.sm,
  },
  modalTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtnText: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  detailVal: {
    color: Colors.textLight,
    fontSize: 12,
  },
  detailValBold: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  detailValHighlight: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: '800',
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.borderDark,
    marginVertical: Spacing.md,
  },
  closeModalBtn: {
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.px10,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  closeModalBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  roleSelectChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  roleSelectChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  roleSelectText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  roleSelectTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.glowOrange,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.px10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: Spacing.px10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.successBright,
    marginBottom: Spacing.sm,
  },
  successText: {
    color: Colors.successBright,
    fontSize: 12,
    fontWeight: '700',
  },
  topBannerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  mobileCardList: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  userCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.xs,
  },
  userCardName: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  userCardUsername: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  userCardBody: {
    gap: 4,
    marginBottom: Spacing.sm,
  },
  userCardEmail: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  userCardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  userCardMeta: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  userCardSubMeta: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  userCardActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    paddingTop: Spacing.sm,
  },
  actionBtnViewMobile: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    flex: 1,
    alignItems: 'center',
  },
  actionBtnEditMobile: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: '#eab308',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    flex: 1,
    alignItems: 'center',
  },
  actionBtnToggleMobile: {
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    flex: 1,
    alignItems: 'center',
  },
  actionBtnResetMobile: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    flex: 1,
    alignItems: 'center',
  },
});
