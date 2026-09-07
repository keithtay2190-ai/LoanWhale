import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { View } from 'react-native';

import { ErrorBoundary } from '@/components/error-boundary';
import { ProfileProvider } from '@/context/profile-context';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_700Bold });

  // Brief blank frame while the heading font loads - avoids a flash of
  // system-font headers before everything's ready. The onboarding check
  // itself lives in (tabs)/index.tsx, the screen "/" actually resolves to -
  // picking it here via a conditional initialRouteName looked right in Expo
  // Go but wasn't reliable in a real standalone build (its cold-launch
  // initial-URL resolution can go straight to "/", bypassing this entirely).
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <ErrorBoundary>
      <ProfileProvider>
        <StatusBar style="light" />
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
        />
      </ProfileProvider>
    </ErrorBoundary>
  );
}
