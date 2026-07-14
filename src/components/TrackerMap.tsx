import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { UrlTile, Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface TrackerMapProps {
  patientLocation: { latitude: number; longitude: number };
  homeLocation: { latitude: number; longitude: number };
  isWandering: boolean;
  hasSOS: boolean;
  hasFall: boolean;
  batteryLevel: number;
  colors: any;
  patientName: string;
  setScrollEnabled: (enabled: boolean) => void;
  landmarks: { name: string; lat: number; lng: number }[];
  caretakerLocation?: { latitude: number; longitude: number } | null;
}

export default function TrackerMap({
  patientLocation,
  homeLocation,
  isWandering,
  hasSOS,
  hasFall,
  colors,
  setScrollEnabled,
  landmarks,
  caretakerLocation,
  patientName,
}: TrackerMapProps) {
  return (
    <MapView
      style={styles.nativeMap}
      mapType="none"
      initialRegion={{
        latitude: homeLocation.latitude,
        longitude: homeLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }}
      onTouchStart={() => setScrollEnabled(false)}
      onTouchEnd={() => setScrollEnabled(true)}
    >
      <UrlTile
        urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        maximumZ={19}
        tileSize={256}
      />

      {/* Safe Zone Circle */}
      <Circle
        center={homeLocation}
        radius={300}
        strokeWidth={2}
        strokeColor={isWandering ? colors.danger : colors.success}
        fillColor={isWandering ? "rgba(239, 68, 68, 0.08)" : "rgba(34, 197, 94, 0.08)"}
        lineDashPattern={[6, 6]}
      />

      {/* Home Location Marker */}
      <Marker 
        coordinate={homeLocation} 
        title="Home (Safe Zone)" 
        description="Safe Zone Center"
      >
        <View style={[styles.nativeMarkerBg, { backgroundColor: colors.primary }]}>
          <Ionicons name="home" size={16} color="#FFFFFF" />
        </View>
      </Marker>

      {/* Landmarks */}
      {landmarks.map((l, idx) => (
        <Marker
          key={idx}
          coordinate={{ latitude: l.lat, longitude: l.lng }}
          title={l.name}
        >
          <View style={styles.nativeLandmarkPin}>
            <Ionicons name="location" size={12} color="#475569" />
          </View>
        </Marker>
      ))}

      {/* Patient Marker */}
      <Marker
        coordinate={patientLocation}
        title={patientName}
        description={isWandering ? 'Outside Safe Zone!' : 'Inside Safe Zone'}
      >
        <View style={[
          styles.nativeMarkerBg, 
          { backgroundColor: (isWandering || hasSOS || hasFall) ? colors.danger : colors.success }
        ]}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </View>
      </Marker>

      {/* Caretaker Blue Dot */}
      {caretakerLocation && (
        <Marker
          coordinate={caretakerLocation}
          title="You (Caretaker)"
          description="Your current location"
        >
          <View style={styles.caretakerDot}>
            <View style={styles.caretakerDotInner} />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
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
  caretakerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caretakerDotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});
