import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTracker } from '@/context/TrackerContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

import TrackerMap from '@/components/TrackerMap';

export default function MapScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { role } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (role === 'patient') {
      router.replace('/patient-home');
    }
  }, [role, router]);
  
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [caretakerLocation, setCaretakerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const {
    patientName,
    homeLocation,
    patientLocation,
    isWandering,
    hasFall,
    hasSOS,
    batteryLevel,
    signalStrength,
    simulateWandering,
    returnHome,
    triggerSOS,
    simulateFall,
    resolveEmergency,
    simulateBatteryDrain,
    simulateBatteryCharge,
    updateHomeLocation,
  } = useTracker();

  // Animated coordinates for Web smooth movement
  const [animatedLat] = useState(new Animated.Value(homeLocation.latitude));
  const [animatedLng] = useState(new Animated.Value(homeLocation.longitude));

  const handleResolveEmergency = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to resolve this emergency?')) {
        resolveEmergency();
      }
    } else {
      Alert.alert(
        'Resolve Emergency',
        'Are you sure you want to resolve this emergency?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Resolve', style: 'destructive', onPress: resolveEmergency },
        ]
      );
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedLat, {
        toValue: patientLocation.latitude,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedLng, {
        toValue: patientLocation.longitude,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [patientLocation, animatedLat, animatedLng]);

  // Caretaker's own location tracking (does NOT push to Firebase)
  useEffect(() => {
    if (role !== 'caretaker') return;

    let sub: Location.LocationSubscription | null = null;

    const startCaretakerTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 5 },
          (loc) => {
            setCaretakerLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        );
      } catch (err) {
        console.warn('Caretaker location error:', err);
      }
    };

    startCaretakerTracking();
    return () => { if (sub) try { sub.remove(); } catch { /* safe to ignore on web */ } };
  }, [role]);

  // Determine tracker status details
  let statusText = 'Safe (At Home)';
  let statusColor: string = colors.success;
  let statusBg = '#E8F5E9'; // Soft green background
  let statusIcon = 'checkmark-circle';

  if (hasSOS) {
    statusText = 'EMERGENCY SOS!';
    statusColor = colors.danger;
    statusBg = '#FFEBEE'; // Soft red background
    statusIcon = 'alert-circle';
  } else if (hasFall) {
    statusText = 'FALL DETECTED!';
    statusColor = colors.danger;
    statusBg = '#FFF3E0'; // Soft orange background
    statusIcon = 'warning';
  } else if (isWandering) {
    statusText = 'Wandering Alert - Outside Safe Zone!';
    statusColor = colors.danger;
    statusBg = '#FFEBEE';
    statusIcon = 'alert-circle';
  }



  // Landmark Coordinates
  const landmarks = [
    { name: 'Winneba Market', lat: 5.3512, lng: -0.6295 },
    { name: 'Trauma & Specialist Hospital', lat: 5.3610, lng: -0.6320 },
    { name: 'Windy Bay Beach', lat: 5.3400, lng: -0.6180 },
    { name: 'UEW Campus', lat: 5.3480, lng: -0.6200 },
  ];

  const getBatteryColor = (level: number) => {
    if (level < 0) return colors.textSecondary;
    if (level > 50) return colors.success;
    if (level >= 20) return colors.warning;
    return colors.danger;
  };

  return (
    <ScrollView 
      scrollEnabled={scrollEnabled}
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.contentContainer}
    >
      
      {/* Geofence Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusBg, borderColor: statusColor }]}>
        <Ionicons name={statusIcon as any} size={26} color={statusColor} />
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusTitle, { color: statusColor }]}>{statusText}</Text>
          <Text style={[styles.statusSubtitle, { color: colors.text }]}>
            Patient: {patientName} • Lat: {patientLocation.latitude.toFixed(4)}, Lng: {patientLocation.longitude.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Critical Alert Warning Panel */}
      {(isWandering || hasSOS || hasFall) && (
        <View style={styles.flashingWarning}>
          <Ionicons name="warning" size={24} color="#FFFFFF" style={styles.warningIcon} />
          <Text style={styles.flashingText}>
            {hasSOS 
              ? `🚨 ${patientName} triggered the SOS Panic button!`
              : hasFall
              ? '⚠️ Fall detected! Immediate assistance may be required.'
              : `🚨 Geofence violation: ${patientName} left the Safe Zone!`}
          </Text>
          <TouchableOpacity style={styles.resolveButton} onPress={handleResolveEmergency} activeOpacity={0.7}>
            <Text style={styles.resolveButtonText}>Resolve</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map View Container */}
      <View style={[styles.mapContainer, { borderColor: colors.border }]}>
        <TrackerMap
          patientLocation={patientLocation}
          homeLocation={homeLocation}
          isWandering={isWandering}
          hasSOS={hasSOS}
          hasFall={hasFall}
          batteryLevel={batteryLevel}
          colors={colors}
          patientName={patientName}
          setScrollEnabled={setScrollEnabled}
          landmarks={landmarks}
          caretakerLocation={caretakerLocation}
        />

        {/* Floating Quick Stats */}
        <View style={[styles.floatingStats, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.statItem}>
            <Ionicons name="battery-dead" size={16} color={getBatteryColor(batteryLevel)} />
            <Text style={[styles.statText, { color: getBatteryColor(batteryLevel) }]}>{batteryLevel >= 0 ? `${batteryLevel}%` : 'N/A'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="wifi" size={16} color={colors.primaryLight} />
            <Text style={[styles.statText, { color: colors.text }]}>{signalStrength}</Text>
          </View>
        </View>
      </View>

      {/* Simulator Control Center Title */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Caregiver Controls & Simulation</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Manage patient home zone or simulate telemetry to test alerts system.
      </Text>

      {/* Control Buttons Grid */}
      <View style={styles.buttonGrid}>
        
        {/* Button 0: Set Home Location */}
        <TouchableOpacity
          style={[
            styles.simButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.primary },
          ]}
          onPress={() => {
            Alert.alert(
              'Set Home Location',
              `Are you sure you want to set ${patientName}'s current live location as their new Safe Zone center?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Set Home', onPress: () => updateHomeLocation(patientLocation) },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight + '40' }]}>
            <Ionicons name="location" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.buttonTitle, { color: colors.text }]}>Set Home Location</Text>
          <Text style={styles.buttonDesc}>Set patient's live location as Safe Zone</Text>
        </TouchableOpacity>
        
        {/* Button 1: Simulate Wandering */}
        <TouchableOpacity
          style={[
            styles.simButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.warning },
          ]}
          onPress={simulateWandering}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFF9C4' }]}>
            <Ionicons name="walk" size={24} color={colors.warning} />
          </View>
          <Text style={[styles.buttonTitle, { color: colors.text }]}>Simulate Wandering</Text>
          <Text style={styles.buttonDesc}>Move patient outside safety geofence</Text>
        </TouchableOpacity>

        {/* Button 2: Return Home */}
        <TouchableOpacity
          style={[
            styles.simButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.success },
          ]}
          onPress={returnHome}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#C8E6C9' }]}>
            <Ionicons name="home-sharp" size={24} color={colors.success} />
          </View>
          <Text style={[styles.buttonTitle, { color: colors.text }]}>Return Home</Text>
          <Text style={styles.buttonDesc}>Reset patient location to home zone</Text>
        </TouchableOpacity>

        {/* Button 3: Trigger SOS */}
        <TouchableOpacity
          style={[
            styles.simButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.danger },
          ]}
          onPress={triggerSOS}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFCDD2' }]}>
            <Ionicons name="notifications-circle" size={24} color={colors.danger} />
          </View>
          <Text style={[styles.buttonTitle, { color: colors.text }]}>Trigger SOS</Text>
          <Text style={styles.buttonDesc}>Simulate distress button press</Text>
        </TouchableOpacity>

        {/* Button 4: Simulate Fall */}
        <TouchableOpacity
          style={[
            styles.simButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.danger },
          ]}
          onPress={simulateFall}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFE0B2' }]}>
            <Ionicons name="body" size={24} color="#F57C00" />
          </View>
          <Text style={[styles.buttonTitle, { color: colors.text }]}>Simulate Fall</Text>
          <Text style={styles.buttonDesc}>Trigger accelerometer impact alert</Text>
        </TouchableOpacity>

        {/* Button 5: Drain Battery */}
        <TouchableOpacity
          style={[
            styles.simButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.warning },
          ]}
          onPress={simulateBatteryDrain}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFF9C4' }]}>
            <Ionicons name="battery-dead" size={24} color={colors.warning} />
          </View>
          <Text style={[styles.buttonTitle, { color: colors.text }]}>Drain Battery</Text>
          <Text style={styles.buttonDesc}>Decrease tracker battery by 15%</Text>
        </TouchableOpacity>

        {/* Button 6: Charge Battery */}
        <TouchableOpacity
          style={[
            styles.simButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.success },
          ]}
          onPress={simulateBatteryCharge}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#C8E6C9' }]}>
            <Ionicons name="battery-charging" size={24} color={colors.success} />
          </View>
          <Text style={[styles.buttonTitle, { color: colors.text }]}>Charge Battery</Text>
          <Text style={styles.buttonDesc}>Reset tracker battery to 100%</Text>
        </TouchableOpacity>

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  flashingWarning: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIcon: {
    marginRight: 8,
  },
  flashingText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  resolveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  mapContainer: {
    height: 380,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nativeMap: {
    ...StyleSheet.absoluteFillObject,
  },
  nativeMarkerBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  webMap: {
    flex: 1,
    backgroundColor: '#E0F2FE', // Light blue/ocean theme
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  seaArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#7DD3FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#38BDF8',
  },
  seaText: {
    color: '#0369A1',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  road: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  roadMain: {
    top: '40%',
    left: 0,
    right: 0,
    height: 16,
  },
  roadBypass: {
    left: '30%',
    top: 0,
    bottom: 0,
    width: 14,
    transform: [{ rotate: '15deg' }],
  },
  roadMarket: {
    top: '70%',
    left: 0,
    right: 0,
    height: 10,
  },
  webSafeZone: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(30, 64, 175, 0.05)',
    transform: [{ translateX: -45 }, { translateY: -45 }],
  },
  safeZoneLabel: {
    position: 'absolute',
    fontSize: 9,
    color: '#1E40AF',
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  webHomeMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  landmarkPin: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -30 }, { translateY: -10 }],
    width: 60,
  },
  landmarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  landmarkText: {
    fontSize: 8,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  webPatientMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -45 }, { translateY: -45 }],
    zIndex: 10,
    width: 90,
    height: 90,
    justifyContent: 'center',
  },
  patientIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  patientLabelBg: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignItems: 'center',
  },
  patientLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  patientBatteryText: {
    color: '#93C5FD',
    fontSize: 7,
    marginTop: 1,
  },
  floatingStats: {
    position: 'absolute',
    bottom: 75,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  simButton: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 12,
  },
  nativeLandmarkPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#64748B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
