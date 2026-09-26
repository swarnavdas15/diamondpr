import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

type WizardStep = 'IDENTIFIER' | 'OTP' | 'NEW_PASS' | 'SUCCESS';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ visible, onClose }) => {
  const { requestOtp, verifyOtp, resetPassword } = useAuth();

  const [step, setStep] = useState<WizardStep>('IDENTIFIER');
  const [identifier, setIdentifier] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestOtp = () => {
    setErrorMsg('');
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Username or Registered Email Address.');
      return;
    }

    try {
      const res = requestOtp(identifier);
      setMaskedEmail(res.emailMasked);
      setStep('OTP');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request OTP');
    }
  };

  const handleVerifyOtp = () => {
    setErrorMsg('');
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email inbox.');
      return;
    }

    try {
      verifyOtp(identifier, otpCode);
      setStep('NEW_PASS');
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed');
    }
  };

  const handleResetPassword = () => {
    setErrorMsg('');
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    try {
      resetPassword(identifier, newPassword);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password');
    }
  };

  const handleClose = () => {
    setStep('IDENTIFIER');
    setIdentifier('');
    setMaskedEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPass(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Password Recovery (Email OTP)</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {/* STEP 1: Enter Username or Registered Email */}
          {step === 'IDENTIFIER' && (
            <View style={styles.formContent}>
              <Text style={styles.subText}>
                Enter your Username (e.g. <Text style={styles.bold}>superadmin</Text>) or Registered Email Address below. A 6-digit One-Time Password (OTP) will be sent directly to your registered email inbox.
              </Text>

              <Text style={styles.label}>Username or Registered Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. superadmin or amarchattaraj@gmail.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={identifier}
                onChangeText={setIdentifier}
              />

              <TouchableOpacity style={styles.actionBtn} onPress={handleRequestOtp}>
                <Text style={styles.actionBtnText}>Send OTP to Registered Email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Enter OTP retrieved from Email Inbox */}
          {step === 'OTP' && (
            <View style={styles.formContent}>
              {/* Notice confirming email delivery */}
              <View style={styles.emailNoticeBox}>
                <Text style={styles.noticeHeader}>📩 OTP SENT TO EMAIL INBOX</Text>
                <Text style={styles.noticeText}>
                  A 6-digit verification code has been dispatched to your registered email address (<Text style={styles.bold}>{maskedEmail}</Text>).
                </Text>
                <Text style={styles.timerNotice}>⏱ Valid for 5 minutes. Check your email inbox to retrieve the code.</Text>
              </View>

              <Text style={styles.label}>Enter 6-Digit OTP Code from Email</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="------"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
              />

              <TouchableOpacity style={styles.actionBtn} onPress={handleVerifyOtp}>
                <Text style={styles.actionBtnText}>Verify OTP & Proceed</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOtp}>
                <Text style={styles.resendText}>Didn't receive email? Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Create New Password */}
          {step === 'NEW_PASS' && (
            <View style={styles.formContent}>
              <Text style={styles.subText}>
                OTP verified successfully! Create a new secure password for your account.
              </Text>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Enter new password (min 6 chars)"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPass}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPass}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity style={styles.actionBtn} onPress={handleResetPassword}>
                <Text style={styles.actionBtnText}>Update & Save Password</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Success */}
          {step === 'SUCCESS' && (
            <View style={styles.formContent}>
              <View style={styles.successCard}>
                <Text style={styles.successTitle}>✅ Password Successfully Reset!</Text>
                <Text style={styles.subText}>
                  Your password has been updated. You can now log in using your User ID and new password.
                </Text>
                <TouchableOpacity style={styles.actionBtn} onPress={handleClose}>
                  <Text style={styles.actionBtnText}>Return to Login Page</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    maxWidth: 480,
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
    alignItems: 'center',
    marginBottom: Spacing.px14,
  },
  title: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  closeText: {
    color: Colors.accentTeal,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.px10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '600',
  },
  formContent: {
    gap: Spacing.md,
  },
  subText: {
    color: Colors.accentTeal,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.px10,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  otpInput: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    color: Colors.accentTeal,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  passInput: {
    flex: 1,
    paddingVertical: Spacing.px10,
    color: Colors.textLight,
    fontSize: 13,
  },
  eyeIcon: {
    fontSize: 16,
    padding: Spacing.xs,
  },
  actionBtn: {
    backgroundColor: Colors.industrialOrange,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  resendText: {
    color: Colors.highlightOrange,
    fontSize: 12,
    fontWeight: '600',
  },
  emailNoticeBox: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.md,
    padding: Spacing.px14,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    gap: Spacing.px6,
  },
  noticeHeader: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noticeText: {
    color: Colors.textLight,
    fontSize: 12,
    lineHeight: 18,
  },
  timerNotice: {
    color: Colors.highlightOrange,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  bold: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  successCard: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.px10,
  },
  successTitle: {
    color: Colors.primaryLight,
    fontSize: 18,
    fontWeight: '800',
  },
});
