import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/config/auth';

export default function SignupScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { signup, googleLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!selectedRole) {
      setError('Please select your role first.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await signup(email.trim(), password, selectedRole);
      // AuthContext will update, root layout will redirect automatically
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError(err?.message || 'Signup failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!selectedRole) {
      setError('Please select your role first, then sign in with Google.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await googleLogin(selectedRole);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const RoleCard = ({ role, icon, title, description }: { role: UserRole; icon: string; title: string; description: string }) => {
    const isSelected = selectedRole === role;
    return (
      <TouchableOpacity
        style={[
          styles.roleCard,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? (scheme === 'dark' ? colors.backgroundSelected : '#EFF6FF') : colors.cardBackground,
            borderWidth: isSelected ? 2.5 : 1.5,
          },
        ]}
        onPress={() => setSelectedRole(role)}
        activeOpacity={0.7}
      >
        <View style={[styles.roleIconCircle, { backgroundColor: isSelected ? colors.primary : colors.backgroundElement }]}>
          <Ionicons name={icon as any} size={28} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
        </View>
        <View style={styles.roleTextWrap}>
          <Text style={[styles.roleTitle, { color: isSelected ? colors.primary : colors.text }]}>{title}</Text>
          <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.roleCheck} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-add" size={44} color="#FFFFFF" />
          </View>
          <Text style={[styles.appTitle, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
            Choose your role and get started
          </Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>I am a...</Text>
          <RoleCard
            role="caretaker"
            icon="eye-outline"
            title="Caretaker"
            description="I want to monitor and track a patient's location and safety."
          />
          <RoleCard
            role="patient"
            icon="heart-outline"
            title="Patient / Family Setup"
            description="I am setting up this device for a person who needs tracking."
          />
        </View>

        {/* Signup Form */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Create a password (min 6 chars)"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <>
              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Google Sign Up */}
              <TouchableOpacity
                style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={handleGoogleSignup}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={[styles.googleBtnText, { color: colors.text }]}>Sign up with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: colors.primary }]}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  roleSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  roleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleTextWrap: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  roleCheck: {
    marginLeft: 8,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
