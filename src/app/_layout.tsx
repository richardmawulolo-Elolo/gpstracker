import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TrackerProvider } from '@/context/TrackerContext';
import { ActivityIndicator, View } from 'react-native';

// Keep splash screen visible while assets load
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Not logged in — redirect to login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Logged in — redirect to main tabs
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TrackerProvider>
        <RootNavigator />
      </TrackerProvider>
    </AuthProvider>
  );
}
