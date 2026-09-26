import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  const handleLogin = () => {
    setErrorMsg('');
    if (!username.trim() || !password.trim()) {
      setErrorMsg('User ID and Password are required.');
      return;
    }

    try {
      login(username, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.loginCard}>
          {/* Company Brand Logo Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoSymbol}>❖</Text>
            </View>
            <Text style={styles.brandTitle}>DIAMOND FLANGE ERP</Text>
            <Text style={styles.brandSubtitle}>Industrial Manufacturing & Access Control System</Text>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {/* Login Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>User ID / Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter User ID (e.g. admin)"
              placeholderTextColor={Colors.textSubtle}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => setForgotPasswordVisible(true)}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password"
                placeholderTextColor={Colors.textSubtle}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.loginBtnText}>SIGN IN TO ERP SYSTEM</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Protected Industrial System • Centralized Theme Edition</Text>
          </View>
        </View>

        {/* Forgot Password OTP Modal */}
        <ForgotPasswordModal visible={forgotPasswordVisible} onClose={() => setForgotPasswordVisible(false)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.industrialOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.glowOrange,
  },
  logoSymbol: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
  },
  brandTitle: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  formGroup: {
    gap: Spacing.px14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  forgotText: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.px14,
    paddingVertical: Spacing.md,
    color: Colors.textLight,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.px14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    color: Colors.textLight,
    fontSize: 14,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  eyeIcon: {
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: Colors.industrialOrange,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.px14,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.glowOrange,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
});
