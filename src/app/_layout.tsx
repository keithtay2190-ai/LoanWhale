import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ErrorBoundary } from '@/components/error-boundary';
import { ProfileProvider } from '@/context/profile-context';
import { getHasSeenOnboarding } from '@/lib/onboarding-storage';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [fontsLoaded] = useFonts({ PlusJakartaSans_700Bold });

  useEffect(() => {
    getHasSeenOnboarding().then(setHasSeenOnboarding);
  }, []);

  // Brief blank frame while we check AsyncStorage (near-instant) and load the
  // heading font - avoids a flash of the wrong first screen or system-font
  // headers before everything's ready.
  if (hasSeenOnboarding === null || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <ErrorBoundary>
      <ProfileProvider>
        <StatusBar style="light" />
        <Stack
          initialRouteName={hasSeenOnboarding ? '(tabs)' : 'onboarding'}
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
        />
      </ProfileProvider>
    </ErrorBoundary>
  );
}
