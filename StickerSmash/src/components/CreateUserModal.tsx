import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ visible, onClose }) => {
  const { createUser } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<Role>('PRODUCTION');
  const [isActive, setIsActive] = useState(true);

  const [createdUser, setCreatedUser] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const roles: { role: Role; label: string; department: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', department: 'Executive Management' },
    { role: 'ADMIN', label: 'Admin', department: 'Plant Operations' },
    { role: 'SALES', label: 'Sales Department', department: 'Commercial & Accounts' },
    { role: 'PURCHASE', label: 'Purchase Department', department: 'Procurement & Supply Chain' },
    { role: 'PRODUCTION', label: 'Production Department', department: 'Shop Floor & Machining' },
    { role: 'QUALITY_TESTING', label: 'Quality Testing', department: 'Inspection & QA' },
    { role: 'DISPATCH', label: 'Dispatch Department', department: 'Logistics & Shipment' },
  ];

  const handleSubmit = () => {
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }
    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your confirm password.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email Address is required.');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMsg('Mobile Number is required.');
      return;
    }

    try {
      const newUser = createUser({
        name: name.trim(),
        username: username.trim(),
        password,
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        employeeId: employeeId.trim() || undefined,
        role,
        isActive,
      });
      setCreatedUser(newUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user account');
    }
  };

  const handleReset = () => {
    setName('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setEmail('');
    setMobileNumber('');
    setEmployeeId('');
    setRole('PRODUCTION');
    setIsActive(true);
    setCreatedUser(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleReset}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleReset}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Super Admin: Manual User Creation</Text>
              <Text style={styles.subTitle}>Manually define username, password, department role, and user profile.</Text>
            </View>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {createdUser ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>✅ User Account Created & Credentials Assigned!</Text>
              <Text style={styles.infoText}>Full Name: <Text style={styles.bold}>{createdUser.name}</Text></Text>
              <Text style={styles.infoText}>Assigned User ID / Username: <Text style={styles.boldHighlight}>{createdUser.username}</Text></Text>
              <Text style={styles.infoText}>Assigned Password: <Text style={styles.boldHighlight}>{createdUser.password}</Text></Text>
              <Text style={styles.infoText}>Registered Email: <Text style={styles.bold}>{createdUser.email}</Text></Text>
              <Text style={styles.infoText}>Mobile Contact: <Text style={styles.bold}>{createdUser.mobileNumber || 'N/A'}</Text></Text>
              <Text style={styles.infoText}>Department & Role: <Text style={styles.bold}>{createdUser.role.replace('_', ' ')}</Text></Text>
              <Text style={styles.infoText}>Employee ID: <Text style={styles.bold}>{createdUser.employeeId || 'N/A'}</Text></Text>
              <Text style={styles.infoText}>Status: <Text style={styles.boldGreen}>{createdUser.isActive ? 'Active (Can Log In Immediately)' : 'Inactive'}</Text></Text>

              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  ℹ️ Account is ready. The user can log in immediately with Username: <Text style={styles.bold}>{createdUser.username}</Text> and the assigned Password.
                </Text>
              </View>

              <TouchableOpacity style={styles.doneBtn} onPress={handleReset}>
                <Text style={styles.doneBtnText}>Close & Return to Directory</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                {errorMsg ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                  </View>
                ) : null}

                {/* 1. Full Name */}
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />

                {/* 2. Username */}
                <Text style={styles.label}>Username / User ID (Must be unique) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. production_ramesh"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />

                {/* 3. Password & Confirm Password */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Password *</Text>
                    <View style={styles.passInputWrapper}>
                      <TextInput
                        style={styles.passInput}
                        placeholder="e.g. Prod@123"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Confirm Password *</Text>
                    <View style={styles.passInputWrapper}>
                      <TextInput
                        style={styles.passInput}
                        placeholder="Re-enter password"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>
                </View>

                {/* 4. Email & Mobile */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Email Address *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. ramesh@flangeerp.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Mobile Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                    />
                  </View>
                </View>

                {/* 5. Employee ID & Account Status */}
                <View style={styles.rowTwo}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Employee ID (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. EMP-1042"
                      placeholderTextColor="#94a3b8"
                      value={employeeId}
                      onChangeText={setEmployeeId}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Account Status</Text>
                    <View style={styles.statusToggleRow}>
                      <TouchableOpacity
                        style={[styles.statusChip, isActive && styles.statusChipActive]}
                        onPress={() => setIsActive(true)}
                      >
                        <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>Active</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusChip, !isActive && styles.statusChipInactive]}
                        onPress={() => setIsActive(false)}
                      >
                        <Text style={[styles.statusChipText, !isActive && styles.statusChipTextInactive]}>Inactive</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* 6. Department Role Selection */}
                <Text style={styles.label}>Department & Role Access *</Text>
                <View style={styles.roleGrid}>
                  {roles.map((item) => {
                    const isSelected = role === item.role;
                    return (
                      <TouchableOpacity
                        key={item.role}
                        style={[styles.roleBtn, isSelected && styles.roleBtnActive]}
                        onPress={() => setRole(item.role)}
                      >
                        <Text style={[styles.roleBtnText, isSelected && styles.roleBtnTextActive]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.roleDeptText, isSelected && styles.roleDeptTextActive]}>
                          {item.department}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Submit Action Button */}
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitBtnText}>✓ Save & Create User Account</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.px14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.px10,
  },
  title: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  subTitle: {
    color: Colors.accentTeal,
    fontSize: 11,
    marginTop: 2,
  },
  closeText: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  formScroll: {
    flex: 1,
  },
  formGroup: {
    gap: Spacing.px10,
  },
  label: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.px10,
  },
  passInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingRight: Spacing.px10,
  },
  passInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    color: Colors.textLight,
    fontSize: 13,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  eyeText: {
    fontSize: 14,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: Spacing.px6,
    marginTop: 2,
  },
  statusChip: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
  },
  statusChipActive: {
    backgroundColor: 'rgba(41, 88, 92, 0.1)',
    borderColor: Colors.accentTeal,
  },
  statusChipInactive: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    borderColor: Colors.industrialOrange,
  },
  statusChipText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  statusChipTextInactive: {
    color: Colors.industrialOrange,
    fontWeight: '800',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleBtn: {
    width: '48%',
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  roleBtnActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  roleBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
  roleBtnTextActive: {
    color: Colors.white,
  },
  roleDeptText: {
    color: Colors.textSubtle,
    fontSize: 10,
    marginTop: 2,
  },
  roleDeptTextActive: {
    color: Colors.primaryLight,
  },
  submitBtn: {
    backgroundColor: Colors.industrialOrange,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.px14,
    ...Shadows.glowOrange,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  errorBanner: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.px10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
  },
  errorText: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '700',
  },
  successCard: {
    gap: Spacing.sm,
  },
  successTitle: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  infoText: {
    color: Colors.textLight,
    fontSize: 13,
  },
  bold: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  boldHighlight: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  boldGreen: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  noticeBox: {
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginVertical: Spacing.px10,
  },
  noticeText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  doneBtn: {
    backgroundColor: Colors.accentTeal,
    borderRadius: Radius.md,
    paddingVertical: Spacing.px10,
    alignItems: 'center',
    marginTop: Spacing.px10,
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
