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

  useEffect(() => {
    getHasSeenOnboarding().then(setHasSeenOnboarding);
  }, []);

  // Brief blank frame while we check AsyncStorage (near-instant) - avoids a
  // flash of the wrong first screen before we know which one to show.
  if (hasSeenOnboarding === null) {
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
