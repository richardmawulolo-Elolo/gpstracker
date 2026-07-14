import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTracker, HistoryItem } from '@/context/TrackerContext';
import { Colors } from '@/constants/theme';

export default function HistoryScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const { history } = useTracker();

  const renderHistoryEntry = ({ item }: { item: HistoryItem }) => {
    // Map status from context to required: 'Safe' or 'Outside Zone'
    const isSafe = item.status === 'safe';
    const statusText = isSafe ? 'Safe' : 'Outside Zone';
    const dotColor = isSafe ? colors.success : colors.danger;
    const statusTextColor = isSafe ? colors.success : colors.danger;

    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        
        {/* Left Side: Status Dot Indicator */}
        <View style={styles.dotContainer}>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        </View>

        {/* Middle: Details (Status, Coordinates) */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.statusLabel, { color: statusTextColor }]}>
            {statusText}
          </Text>
          <Text style={[styles.coordinatesText, { color: colors.text }]}>
            Lat: {item.coordinates.latitude.toFixed(4)}, Lng: {item.coordinates.longitude.toFixed(4)}
          </Text>
          {item.locationName && (
            <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>
              📍 {item.locationName}
            </Text>
          )}
        </View>

        {/* Right Side: Timestamp */}
        <View style={styles.timestampContainer}>
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.timestampText, { color: colors.textSecondary }]}>
            {item.time}
          </Text>
        </View>

      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header telemetry info bar */}
      <View style={[styles.summaryBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabelTitle, { color: colors.textSecondary }]}>Total Logs</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{history.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabelTitle, { color: colors.textSecondary }]}>Compliance</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>94%</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabelTitle, { color: colors.textSecondary }]}>Tracker</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>Active</Text>
        </View>
      </View>

      {/* History flat list */}
      <FlatList
        data={history}
        renderItem={renderHistoryEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
            Location Logs Feed
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No History Logged</Text>
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
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabelTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  dotContainer: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  coordinatesText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
});
