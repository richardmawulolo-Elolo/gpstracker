import React, { useState, useEffect } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { login, googleLogin, googleLoginNative } = useAuth();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID_HERE',
    iosClientId: 'YOUR_IOS_CLIENT_ID_HERE',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID_HERE',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleNativeGoogleLogin(id_token);
      }
    }
  }, [response]);

  const handleNativeGoogleLogin = async (idToken: string) => {
    setError('');
    setIsLoading(true);
    try {
      await googleLoginNative(idToken);
    } catch (err: any) {
      setError(err?.message || 'Google native sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      setError('');
      setIsLoading(true);
      try {
        await googleLogin();
      } catch (err: any) {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      promptAsync();
    }
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
        {/* Header / Branding */}
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.appTitle, { color: colors.text }]}>
            GPS Dementia Tracker
          </Text>
          <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
            Keeping your loved ones safe
          </Text>
        </View>

        {/* Login Form */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Sign in to continue monitoring
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Field */}
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

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your password"
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

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={handleGoogleLogin}
            disabled={isLoading || (!request && Platform.OS !== 'web')}
            activeOpacity={0.8}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={[styles.googleBtnText, { color: colors.text }]}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don&apos;t have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}> Create Account</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    marginTop: 4,
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
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 20,
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
