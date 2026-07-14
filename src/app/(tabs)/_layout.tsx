import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { useTracker } from '@/context/TrackerContext';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { alerts } = useTracker();
  const { role } = useAuth();

  const isPatient = role === 'patient';

  // Count active unresolved critical/warning alerts
  const activeAlertsCount = alerts.filter((a) => !a.resolved).length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: isPatient ? 0 : 64,
          paddingBottom: isPatient ? 0 : 10,
          paddingTop: isPatient ? 0 : 8,
          display: isPatient ? 'none' : 'flex',
          elevation: 8,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTitleStyle: {
          color: '#FFFFFF',
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
        headerTintColor: '#FFFFFF',
        headerTitleAlign: 'center',
      }}
    >
      {/* Patient Mode: Only show the patient-home tab */}
      <Tabs.Screen
        name="patient-home"
        options={{
          title: 'Tracker',
          headerShown: false,
          tabBarLabel: 'Tracker',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'location' : 'location-outline'} size={24} color={color} />
          ),
          // Hide this tab entirely for caretakers
          href: isPatient ? '/patient-home' : null,
        }}
      />

      {/* Caretaker Mode: Show the full dashboard tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Location Map',
          headerTitle: 'GPS Dementia Tracker',
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
          href: isPatient ? null : '/',
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alert Center',
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={24}
              color={color}
            />
          ),
          tabBarBadge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
          },
          href: isPatient ? null : '/alerts',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Location History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
          href: isPatient ? null : '/history',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Patient Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
          href: isPatient ? null : '/profile',
        }}
      />
    </Tabs>
  );
}
