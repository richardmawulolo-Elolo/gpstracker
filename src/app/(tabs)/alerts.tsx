import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTracker, AlertItem } from '@/context/TrackerContext';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function AlertsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const { alerts, dismissAlert, clearAllAlerts, patientName } = useTracker();
  const router = useRouter();

  const handleCallCaregiver = () => {
    const msg = 'Simulating emergency call to Primary Caregiver Abena Mensah (+233 24 123 4567)...';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Simulating Call', msg);
    }
  };

  // Only display active (unresolved) alerts
  const activeAlerts = alerts.filter((a) => !a.resolved);

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'wandering':
        return {
          textColor: '#D97706', // Yellow/Amber 600
          bgColor: '#FEF9C3',    // Light Yellow 100
          borderColor: '#F59E0B', // Amber 500
          icon: 'walk',
        };
      case 'sos':
        return {
          textColor: '#DC2626', // Red 600
          bgColor: '#FEE2E2',    // Light Red 100
          borderColor: '#EF4444', // Red 500
          icon: 'notifications',
        };
      case 'fall':
        return {
          textColor: '#DC2626', // Red 600
          bgColor: '#FEE2E2',    // Light Red 100
          borderColor: '#EF4444', // Red 500
          icon: 'body',
        };
      case 'safe':
      default:
        return {
          textColor: '#16A34A', // Green 600
          bgColor: '#DCFCE7',    // Light Green 100
          borderColor: '#10B981', // Emerald 500
          icon: 'shield-checkmark',
        };
    }
  };

  const renderAlertItem = ({ item }: { item: AlertItem }) => {
    const config = getAlertConfig(item.type);
    
    return (
      <View
        style={[
          styles.alertCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: config.borderColor,
          },
        ]}
      >
        {/* Dismiss 'X' Button */}
        <TouchableOpacity
          style={styles.dismissXBtn}
          onPress={() => dismissAlert(item.id)}
          activeOpacity={0.6}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Card Main Header Info */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon as any} size={18} color={config.textColor} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {item.timestamp}
            </Text>
          </View>
        </View>

        {/* Card Message */}
        <Text style={[styles.alertMessage, { color: colors.text }]}>
          {item.message}
        </Text>

        {/* Action button inside card */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.locateBtn, { backgroundColor: colors.background }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={[styles.locateBtnText, { color: colors.primary }]}>Locate on Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Alert Stats Top Bar */}
      <View style={[styles.summaryPanel, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Active Alerts</Text>
          <Text style={[styles.summaryCount, { color: activeAlerts.length > 0 ? colors.danger : colors.success }]}>
            {activeAlerts.length}
          </Text>
        </View>
        
        <View style={styles.summaryActions}>
          {activeAlerts.length > 0 && (
            <TouchableOpacity style={[styles.clearBtn, { backgroundColor: colors.background }]} onPress={clearAllAlerts}>
              <Ionicons name="checkmark-done" size={18} color={colors.textSecondary} />
              <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Dismiss All</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.emergencyCallBtn, { backgroundColor: colors.danger }]} onPress={handleCallCaregiver}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.emergencyBtnText}>Call Caregiver</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={activeAlerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyText, { color: colors.text }]}>All Clear</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              There are no active alerts. Patient {patientName} is currently safe inside the geofence.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryInfo: {
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryCount: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  alertCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  dismissXBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 20, // Leave room for X button
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  alertMessage: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 12,
    lineHeight: 18,
    opacity: 0.9,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  locateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    opacity: 0.8,
  },
});
