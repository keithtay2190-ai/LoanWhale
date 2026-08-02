import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileMenu } from '@/components/profile-menu';
import { useSession } from '@/hooks/use-session';

export function ScreenHeader({ title }: { title: string }) {
  const { session } = useSession();

  return (
    <View style={styles.headerRow}>
      <Text style={styles.title}>{title}</Text>
      {session ? (
        <ProfileMenu />
      ) : (
        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.authLink}>Log In</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  authLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
});
