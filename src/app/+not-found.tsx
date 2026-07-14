import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function NotFoundScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: true }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
