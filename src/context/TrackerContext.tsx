import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { onValue, ref, set, update } from 'firebase/database';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { database } from '../config/firebase';
import { useAuth } from './AuthContext';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  type: 'wandering' | 'sos' | 'fall' | 'safe' | 'battery';
  timestamp: string;
  resolved: boolean;
}

export interface HistoryItem {
  id: string;
  locationName: string;
  time: string;
  duration: string;
  status: 'safe' | 'warning' | 'danger';
  coordinates: { latitude: number; longitude: number };
}

export interface DeviceInfo {
  ip: string;
  osName: string;
  modelName: string;
  brand: string;
}

interface TrackerContextType {
  patientName: string;
  homeLocation: { latitude: number; longitude: number };
  patientLocation: { latitude: number; longitude: number };
  geofenceRadius: number;
  isWandering: boolean;
  hasFall: boolean;
  hasSOS: boolean;
  alerts: AlertItem[];
  history: HistoryItem[];
  batteryLevel: number;
  signalStrength: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  connectionStatus: 'Connected' | 'Disconnected';
  deviceInfo: DeviceInfo | null;
  simulateWandering: () => void;
  returnHome: () => void;
  triggerSOS: () => void;
  simulateFall: () => void;
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
  setGeofenceRadius: (radius: number) => void;
  forceRefreshLocation: () => Promise<void>;
  resolveEmergency: () => void;
  resolveEmergency: () => void;
  simulateBatteryDrain: () => void;
  simulateBatteryCharge: () => void;
  updateHomeLocation: (location: { latitude: number; longitude: number }) => Promise<void>;
  
  // Multi-patient management
  managedPatients: { id: string; name: string }[];
  availablePatients: { id: string; name: string }[];
  currentPatientId: string | null;
  switchPatient: (uid: string) => void;
  addPatient: (uid: string) => Promise<void>;
  removePatient: (uid: string) => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

// Default fallback coordinates (Winneba center)
const DEFAULT_HOME = { latitude: 5.3520, longitude: -0.6230 };

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();

  const [patientName, setPatientName] = useState('Patient');
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [homeLocation, setHomeLocation] = useState(DEFAULT_HOME);
  const [patientLocation, setPatientLocation] = useState(DEFAULT_HOME);
  
  const homeLocationRef = useRef(homeLocation);
  useEffect(() => {
    homeLocationRef.current = homeLocation;
  }, [homeLocation]);

  const [isWandering, setIsWandering] = useState(false);
  const [hasFall, setHasFall] = useState(false);
  const [hasSOS, setHasSOS] = useState(false);
  const [geofenceRadius, setGeofenceRadiusState] = useState(300);
  const [batteryLevel, setBatteryLevel] = useState(-1);
  const [signalStrength, setSignalStrength] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Excellent');
  const [connectionStatus] = useState<'Connected' | 'Disconnected'>('Connected');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Multi-patient state for caregivers
  const [linkedPatientIds, setLinkedPatientIds] = useState<string[]>([]);
  const [allPatients, setAllPatients] = useState<Record<string, any>>({});
  const [managedPatients, setManagedPatients] = useState<{ id: string; name: string }[]>([]);
  const [availablePatients, setAvailablePatients] = useState<{ id: string; name: string }[]>([]);

  // To allow simulation without real GPS constantly overwriting it
  const [isSimulating, setIsSimulating] = useState(false);
  const isSimulatingRef = useRef(isSimulating);

  useEffect(() => {
    isSimulatingRef.current = isSimulating;
  }, [isSimulating]);

  // Determine the patient node path in Firebase
  // If user is a patient, their own uid is the patient node
  // If user is a caretaker, we use the patient path (for now, single patient)
  const getPatientPath = () => {
    if (!user) return null;
    if (role === 'patient') {
      return `patients/${user.uid}`;
    }
    // For caretaker, we look at the first patient in the patients node
    // Phase 2 will add multi-patient support with proper linking
    return null; // We'll handle caretaker's patient subscription separately
  };

  // Firebase Synchronization — Listen to patient data
  useEffect(() => {
    if (!user) return;

    let patientPath: string;

    if (role === 'patient') {
      patientPath = `patients/${user.uid}`;
    } else {
      // Caretaker: Listen to linked patients and all patients data
      const linkedRef = ref(database, `users/${user.uid}/linkedPatients`);
      const unsubLinked = onValue(linkedRef, (snapshot) => {
        const data = snapshot.val();
        setLinkedPatientIds(data ? Object.keys(data) : []);
      });

      const patientsRef = ref(database, 'patients');
      const unsubPatients = onValue(patientsRef, (snapshot) => {
        const data = snapshot.val();
        setAllPatients(data || {});
      });

      return () => {
        unsubLinked();
        unsubPatients();
      };
    }

    // Patient role: listen to own node
    const patientRef = ref(database, patientPath);
    const unsubscribe = onValue(patientRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.name) {
          if (data.name === 'Patient' && user?.email) {
            const emailPrefix = user.email.split('@')[0];
            const newName = emailPrefix.split(/[\.\-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            setPatientName(newName);
            update(ref(database, `patients/${user.uid}`), { name: newName });
          } else {
            setPatientName(data.name);
          }
        }
        if (data.homeLocation) setHomeLocation(data.homeLocation);
        if (data.location) setPatientLocation(data.location);
        if (data.isWandering !== undefined) setIsWandering(data.isWandering);
        if (data.hasFall !== undefined) setHasFall(data.hasFall);
        if (data.hasSOS !== undefined) setHasSOS(data.hasSOS);
        if (data.batteryLevel !== undefined) setBatteryLevel(data.batteryLevel);
        if (data.signalStrength) setSignalStrength(data.signalStrength);
        if (data.deviceInfo) setDeviceInfo(data.deviceInfo);

        if (data.alerts) {
          const alertsArr = Object.values(data.alerts) as AlertItem[];
          setAlerts(alertsArr.sort((a, b) => parseInt(b.id) - parseInt(a.id)));
        } else {
          setAlerts([]);
        }

        if (data.history) {
          const historyArr = Object.values(data.history) as HistoryItem[];
          setHistory(historyArr.sort((a, b) => parseInt(b.id.split('-')[0] || '0') - parseInt(a.id.split('-')[0] || '0')));
        } else {
          setHistory([]);
        }
      }
    });

    return () => unsubscribe();
  }, [user, role]);

  // Derive caregiver managed/available patients and update active telemetry
  useEffect(() => {
    if (role !== 'caretaker') return;

    const managed: { id: string; name: string }[] = [];
    const available: { id: string; name: string }[] = [];

    Object.keys(allPatients).forEach((id) => {
      const pData = allPatients[id];
      const pName = pData.name || 'Unknown Patient';
      if (linkedPatientIds.includes(id)) {
        managed.push({ id, name: pName });
      } else {
        available.push({ id, name: pName });
      }
    });

    setManagedPatients(managed);
    setAvailablePatients(available);

    // Auto-select first managed patient if current is null or invalid
    let activeId = currentPatientId;
    if (!activeId || !linkedPatientIds.includes(activeId)) {
      activeId = managed.length > 0 ? managed[0].id : null;
      if (activeId !== currentPatientId) {
        setCurrentPatientId(activeId);
      }
    }

    // Update telemetry for the active patient
    if (activeId && allPatients[activeId]) {
      const patientData = allPatients[activeId];
      if (patientData.name) setPatientName(patientData.name);
      if (patientData.homeLocation) setHomeLocation(patientData.homeLocation);
      if (patientData.location) setPatientLocation(patientData.location);
      if (patientData.isWandering !== undefined) setIsWandering(patientData.isWandering);
      if (patientData.hasFall !== undefined) setHasFall(patientData.hasFall);
      if (patientData.hasSOS !== undefined) setHasSOS(patientData.hasSOS);
      if (patientData.batteryLevel !== undefined) setBatteryLevel(patientData.batteryLevel);
      if (patientData.signalStrength) setSignalStrength(patientData.signalStrength);
      if (patientData.deviceInfo) setDeviceInfo(patientData.deviceInfo);

      if (patientData.alerts) {
        const alertsArr = Object.values(patientData.alerts) as AlertItem[];
        setAlerts(alertsArr.sort((a, b) => parseInt(b.id) - parseInt(a.id)));
      } else {
        setAlerts([]);
      }

      if (patientData.history) {
        const historyArr = Object.values(patientData.history) as HistoryItem[];
        setHistory(historyArr.sort((a, b) => parseInt(b.id.split('-')[0] || '0') - parseInt(a.id.split('-')[0] || '0')));
      } else {
        setHistory([]);
      }
    } else if (!activeId) {
      // Clear telemetry if no patient is managed
      setPatientName('No Patient Selected');
      setAlerts([]);
      setHistory([]);
    }
  }, [role, allPatients, linkedPatientIds, currentPatientId]);

  // Fetch device details on mount if user is a patient
  useEffect(() => {
    if (role === 'patient' && user) {
      const getAndStoreDeviceInfo = async () => {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          const ip = data.ip || 'Unknown';

          const newDeviceInfo: DeviceInfo = {
            ip,
            osName: Device.osName || 'Unknown',
            modelName: Device.modelName || 'Unknown',
            brand: Device.brand || 'Unknown',
          };

          setDeviceInfo(newDeviceInfo);
          update(ref(database, `patients/${user.uid}`), { deviceInfo: newDeviceInfo });
        } catch (error) {
          console.warn('Failed to fetch device info:', error);
        }
      };

      getAndStoreDeviceInfo();
    }
  }, [role, user]);

  // Helper to get the correct patient Firebase path for writes
  const getWritePath = (): string | null => {
    if (!user) return null;
    if (role === 'patient') return `patients/${user.uid}`;
    // Caretaker shouldn't write patient location, but can write alerts via simulation
    return currentPatientId ? `patients/${currentPatientId}` : null;
  };

  const addAlert = (title: string, message: string, type: 'wandering' | 'sos' | 'fall' | 'safe' | 'battery') => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = Date.now().toString();
    const newAlert: AlertItem = {
      id,
      title,
      message,
      type,
      timestamp: timeString,
      resolved: false,
    };

    const writePath = getWritePath();
    if (writePath) {
      set(ref(database, `${writePath}/alerts/${id}`), newAlert);
    }
  };

  // Real GPS Location Tracking — ONLY for Patient role
  useEffect(() => {
    if (role !== 'patient' || !user) return;

    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission to access location was denied');
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 0,
          },
          (location) => {
            if (!isSimulatingRef.current) {
              const lat = location.coords.latitude;
              const lng = location.coords.longitude;

              // Haversine formula
              const R = 6371e3;
              const lat1 = lat * Math.PI / 180;
              const homeLat = homeLocationRef.current.latitude;
              const homeLng = homeLocationRef.current.longitude;
              const lat2 = homeLat * Math.PI / 180;
              const deltaLat = (homeLat - lat) * Math.PI / 180;
              const deltaLng = (homeLng - lng) * Math.PI / 180;

              const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;

              const isSafe = distance <= 300;
              const now = new Date();
              const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5);

              update(ref(database, `patients/${user.uid}`), {
                location: { latitude: lat, longitude: lng },
                isWandering: !isSafe,
              });

              const newHistoryEntry: HistoryItem = {
                id,
                locationName: `Live: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                time: timeString,
                duration: 'Live Update',
                status: isSafe ? 'safe' : 'danger',
                coordinates: { latitude: lat, longitude: lng },
              };

              set(ref(database, `patients/${user.uid}/history/${id}`), newHistoryEntry);
            }
          }
        );
      } catch (err) {
        console.warn('Error starting location tracking:', err);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        try {
          locationSubscription.remove();
        } catch {
          // expo-location cleanup can fail on web — safe to ignore
        }
      }
    };
  }, [role, user]);

  // Real Battery Tracking — ONLY for Patient role
  const hasTriggeredLowBatteryRef = useRef(false);

  useEffect(() => {
    if (role !== 'patient' || !user) return;

    const fetchBatteryLevel = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (level !== null && level >= 0) {
          const percentage = Math.round(level * 100);
          update(ref(database, `patients/${user.uid}`), { batteryLevel: percentage });

          if (percentage < 20 && !hasTriggeredLowBatteryRef.current) {
            hasTriggeredLowBatteryRef.current = true;
            addAlert('Low Battery Warning', 'Device battery is low. Please charge the tracker.', 'battery');
          } else if (percentage >= 20) {
            hasTriggeredLowBatteryRef.current = false;
          }
        } else {
          // Unsupported device API (like iOS web). Write -1 to clear out stale values.
          update(ref(database, `patients/${user.uid}`), { batteryLevel: -1 });
        }
      } catch (err) {
        console.warn('Error fetching battery level:', err);
      }
    };

    fetchBatteryLevel();
    const interval = setInterval(fetchBatteryLevel, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user]);

  // Simulation functions (for caretaker demo / testing purposes)
  const simulateWandering = () => {
    const writePath = getWritePath();
    if (!writePath) return;
    setIsSimulating(true);
    
    // Simulate wandering roughly 1.5km away from current home location
    const wanderLocation = {
      latitude: homeLocation.latitude + 0.015,
      longitude: homeLocation.longitude + 0.015,
    };
    
    update(ref(database, writePath), {
      location: wanderLocation,
      isWandering: true,
      signalStrength: 'Good',
    });
    addAlert('Wandering Detected!', `${patientName} has wandered outside the home safe zone.`, 'wandering');
  };

  const returnHome = () => {
    const writePath = getWritePath();
    if (!writePath) return;
    setIsSimulating(false);
    update(ref(database, writePath), {
      location: homeLocation,
      isWandering: false,
      hasFall: false,
      hasSOS: false,
      signalStrength: 'Excellent',
    });
    addAlert('Patient Safe', `${patientName} has returned to the home safe zone.`, 'safe');
  };

  const triggerSOS = () => {
    const writePath = getWritePath();
    if (!writePath) return;
    update(ref(database, writePath), { hasSOS: true });
    addAlert('SOS Emergency Alert!', `${patientName} pressed the tracker SOS button.`, 'sos');
  };

  const simulateFall = () => {
    const writePath = getWritePath();
    if (!writePath) return;
    update(ref(database, writePath), { hasFall: true });
    addAlert('Fall Detected!', `A hard impact was detected by ${patientName}'s tracker.`, 'fall');
  };

  const dismissAlert = (id: string) => {
    const writePath = getWritePath();
    if (!writePath) return;
    update(ref(database, `${writePath}/alerts/${id}`), { resolved: true });
  };

  const clearAllAlerts = () => {
    const writePath = getWritePath();
    if (!writePath) return;
    set(ref(database, `${writePath}/alerts`), null);
  };

  const setGeofenceRadius = (radius: number) => {
    setGeofenceRadiusState(radius);
  };

  const forceRefreshLocation = async () => {
    if (role !== 'patient' || !user || isSimulating) return;
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      update(ref(database, `patients/${user.uid}`), {
        location: { latitude: lat, longitude: lng },
      });
      setPatientLocation({ latitude: lat, longitude: lng });
    } catch (err) {
      console.warn('Error force refreshing location:', err);
    }
  };

  const resolveEmergency = () => {
    const uid = role === 'patient' ? user?.uid : currentPatientId;
    if (!uid) return;

    // Resolve the active state flags
    update(ref(database, `patients/${uid}`), {
      isWandering: false,
      hasSOS: false,
      hasFall: false
    });

    // Also mark all alerts as resolved
    if (alerts && alerts.length > 0) {
      const alertUpdates: Record<string, boolean> = {};
      alerts.forEach(alert => {
        if (!alert.resolved) {
          alertUpdates[`alerts/${alert.id}/resolved`] = true;
        }
      });
      if (Object.keys(alertUpdates).length > 0) {
        update(ref(database, `patients/${uid}`), alertUpdates);
      }
    }

    // Add to history
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const id = Date.now().toString();
    const newHistoryEntry: HistoryItem = {
      id,
      locationName: 'Emergency Resolved (Patient Found)',
      time: timeString,
      duration: 'Resolved',
      status: 'safe',
      coordinates: patientLocation,
    };
    set(ref(database, `patients/${uid}/history/${id}`), newHistoryEntry);
  };

  const simulateBatteryDrain = () => {
    const uid = role === 'patient' ? user?.uid : currentPatientId;
    if (!uid) return;
    const newLevel = Math.max(0, batteryLevel - 15);
    update(ref(database, `patients/${uid}`), { batteryLevel: newLevel });
  };

  const simulateBatteryCharge = () => {
    const uid = role === 'patient' ? user?.uid : currentPatientId;
    if (!uid) return;
    update(ref(database, `patients/${uid}`), { batteryLevel: 100 });
  };

  const switchPatient = (uid: string) => {
    setCurrentPatientId(uid);
  };

  const addPatient = async (uid: string) => {
    if (!user) return;
    await set(ref(database, `users/${user.uid}/linkedPatients/${uid}`), true);
  };

  const removePatient = async (uid: string) => {
    if (!user) return;
    await set(ref(database, `users/${user.uid}/linkedPatients/${uid}`), null);
  };

  const updateHomeLocation = async (location: { latitude: number; longitude: number }) => {
    const writePath = getWritePath();
    if (!writePath) return;
    await update(ref(database, writePath), { homeLocation: location });
  };

  return (
    <TrackerContext.Provider
      value={{
        patientName,
        homeLocation,
        patientLocation,
        geofenceRadius,
        isWandering,
        hasFall,
        hasSOS,
        alerts,
        history,
        batteryLevel,
        signalStrength,
        connectionStatus,
        deviceInfo,
        simulateWandering,
        returnHome,
        triggerSOS,
        simulateFall,
        dismissAlert,
        clearAllAlerts,
        setGeofenceRadius,
        forceRefreshLocation,
        resolveEmergency,
        simulateBatteryDrain,
        simulateBatteryCharge,
        managedPatients,
        availablePatients,
        currentPatientId,
        switchPatient,
        addPatient,
        removePatient,
        updateHomeLocation,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (context === undefined) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
