import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useTracker } from '@/context/TrackerContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function PatientHomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { batteryLevel, triggerSOS, hasSOS, patientName, forceRefreshLocation, resolveEmergency } = useTracker();
  const { logout, role } = useAuth();
  const router = useRouter();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleResolve = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure the caregiver has arrived and the emergency is resolved?');
      if (confirmed) {
        resolveEmergency();
      }
    } else {
      Alert.alert(
        'Cancel SOS',
        'Are you sure the caregiver has arrived and the emergency is resolved?',
        [
          { text: 'No, Wait', style: 'cancel' },
          { text: 'Yes, I am safe', style: 'destructive', onPress: resolveEmergency },
        ]
      );
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceRefreshLocation();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (role === 'caretaker') {
      router.replace('/');
    }
  }, [role, router]);

  // Pulsing animation for the tracking circle
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const getBatteryColor = () => {
    if (batteryLevel < 0) return colors.textSecondary;
    if (batteryLevel > 50) return colors.success;
    if (batteryLevel > 20) return colors.warning;
    return colors.danger;
  };

  const getBatteryIcon = () => {
    if (batteryLevel < 0) return 'battery-dead';
    if (batteryLevel > 75) return 'battery-full';
    if (batteryLevel > 50) return 'battery-half';
    return 'battery-dead';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
        <Text style={styles.topBarTitle}>GPS Tracker Active • {patientName}</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity 
            onPress={handleRefresh} 
            style={[styles.actionBtn, { backgroundColor: colors.success, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4, flexDirection: 'row' }]} 
            disabled={isRefreshing}
          >
            <Ionicons name="sync" size={18} color="#FFFFFF" style={isRefreshing ? { opacity: 0.5 } : {}} />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', opacity: isRefreshing ? 0.5 : 1 }}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.actionBtn}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Pulsing Tracking Circle */}
        <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.trackingCircle, { backgroundColor: hasSOS ? colors.danger : colors.success }]}>
            <Ionicons
              name={hasSOS ? 'warning' : 'location'}
              size={64}
              color="#FFFFFF"
            />
            <Text style={styles.trackingText}>
              {hasSOS ? 'SOS SENT' : 'Tracking Active'}
            </Text>
          </View>
        </Animated.View>

        {/* Battery Level */}
        <View style={[styles.batteryCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Ionicons name={getBatteryIcon() as any} size={32} color={getBatteryColor()} />
          <Text style={[styles.batteryLabel, { color: colors.textSecondary }]}>Battery</Text>
          <Text style={[styles.batteryValue, { color: colors.text }]}>{batteryLevel >= 0 ? `${batteryLevel}%` : 'N/A'}</Text>
        </View>

        {/* SOS Button */}
        <TouchableOpacity
          style={[styles.sosButton, { backgroundColor: hasSOS ? '#991B1B' : colors.danger }]}
          onPress={triggerSOS}
          activeOpacity={0.7}
        >
          <Ionicons name="alert-circle" size={48} color="#FFFFFF" />
          <Text style={styles.sosText}>
            {hasSOS ? 'SOS SENT — HELP IS COMING' : 'PRESS FOR SOS'}
          </Text>
          <Text style={styles.sosSubtext}>
            {hasSOS ? 'Your caretaker has been notified' : 'Tap if you need help'}
          </Text>
        </TouchableOpacity>

        {/* Caregiver Arrived Button */}
        {hasSOS && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={handleResolve}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
            <Text style={styles.resolveButtonText}>Caregiver Has Arrived</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  pulseOuter: {
    marginBottom: 32,
  },
  trackingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  trackingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  batteryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  batteryLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  batteryValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  sosButton: {
    width: '100%',
    paddingVertical: 28,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  sosSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  resolveButton: {
    width: '100%',
    backgroundColor: '#10B981', // Success green
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
