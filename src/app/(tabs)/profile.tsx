import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  useColorScheme,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTracker } from '@/context/TrackerContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const {
    patientName,
    geofenceRadius,
    batteryLevel,
    connectionStatus,
    deviceInfo,
    managedPatients,
    availablePatients,
    currentPatientId,
    switchPatient,
    addPatient,
    removePatient,
  } = useTracker();

  const { logout, user, role } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout();
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => logout() },
        ]
      );
    }
  };

  const handleCallCaregiver = () => {
    const msg = `Calling Ama Mensah at +233 24 000 1234...`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Simulating Call', msg);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level < 0) return colors.textSecondary;
    if (level > 50) return colors.success;
    if (level >= 20) return colors.warning;
    return colors.danger;
  };

  const DetailRow = ({ icon, label, value, valueColor, hideBorder = false, iconColor }: { icon: keyof typeof Ionicons.glyphMap, label: string, value: string, valueColor?: string, hideBorder?: boolean, iconColor?: string }) => (
    <View style={[styles.detailRow, { borderBottomColor: hideBorder ? 'transparent' : colors.border }]}>
      <View style={styles.detailLabelContainer}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          <Ionicons name={icon} size={18} color={iconColor || colors.primary} />
        </View>
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, { color: valueColor || colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>KM</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{patientName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#E2FDF2' }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.success }]}>Active Tracking</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          <DetailRow icon="person-outline" label="Age" value="74" />
          <DetailRow icon="medical-outline" label="Condition" value="Moderate Dementia" />
          <DetailRow icon="location-outline" label="Safe Zone Radius" value={`${geofenceRadius} meters`} />
          <DetailRow icon="battery-half-outline" label="Battery Level" value={batteryLevel >= 0 ? `${batteryLevel}%` : 'N/A'} valueColor={getBatteryColor(batteryLevel)} iconColor={getBatteryColor(batteryLevel)} />
          <DetailRow icon="hardware-chip-outline" label="Tracker Status" value={connectionStatus} hideBorder={!deviceInfo} />
          
          {deviceInfo && (
            <>
              <DetailRow icon="phone-portrait-outline" label="Device Model" value={`${deviceInfo.brand} ${deviceInfo.modelName}`} />
              <DetailRow icon="logo-apple" label="Operating System" value={deviceInfo.osName} />
              <DetailRow icon="globe-outline" label="IP Address" value={deviceInfo.ip} hideBorder />
            </>
          )}
        </View>

        {/* Caregiver Section */}
        <View style={[styles.caregiverSection, { backgroundColor: colors.background }]}>
          <View style={styles.caregiverInfo}>
            <Text style={[styles.caregiverTitle, { color: colors.textSecondary }]}>Primary Caregiver</Text>
            <Text style={[styles.caregiverName, { color: colors.text }]}>{user?.email?.split('@')[0] || 'Caregiver'}</Text>
            <Text style={[styles.caregiverPhone, { color: colors.primary }]}>{user?.email || 'Not set'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: colors.primary }]}
            onPress={handleCallCaregiver}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Patient Management for Caretakers */}
      {role === 'caretaker' && (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 24 }]}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.name, { color: colors.text }]}>Managed Patients</Text>
            </View>
            <TouchableOpacity 
              style={[styles.callBtn, { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20 }]} 
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.detailsContainer}>
            {managedPatients?.map((p) => {
              const isActive = p.id === currentPatientId;
              return (
                <View key={p.id} style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.detailLabelContainer}>
                    <View style={[styles.iconContainer, { backgroundColor: isActive ? colors.primary + '20' : colors.background }]}>
                      <Ionicons name="person" size={18} color={isActive ? colors.primary : colors.textSecondary} />
                    </View>
                    <Text style={[styles.detailValue, { color: isActive ? colors.primary : colors.text }]}>
                      {p.name}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {!isActive && (
                      <TouchableOpacity 
                        style={[styles.smallBtn, { backgroundColor: colors.success + '20' }]} 
                        onPress={() => switchPatient(p.id)}
                      >
                        <Text style={{ color: colors.success, fontWeight: '600' }}>Select</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={[styles.smallBtn, { backgroundColor: colors.danger + '20' }]} 
                      onPress={() => {
                        Alert.alert('Remove Patient', `Are you sure you want to stop managing ${p.name}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => removePatient(p.id) },
                        ]);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {managedPatients?.length === 0 && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
                You are not managing any patients yet.
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      {/* Add Patient Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Patient</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <FlatList
              data={availablePatients}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{item.name}</Text>
                  <TouchableOpacity 
                    style={[styles.smallBtn, { backgroundColor: colors.primary + '20' }]} 
                    onPress={() => {
                      addPatient(item.id);
                      setShowAddModal(false);
                    }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
                  No available patients found.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E6F4FE',
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
  },
  detailsContainer: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  caregiverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 24,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  caregiverName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  caregiverPhone: {
    fontSize: 14,
    fontWeight: '600',
  },
  callBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    height: 54,
    borderRadius: 14,
    marginTop: 24,
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
});
