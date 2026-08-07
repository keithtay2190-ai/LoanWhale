import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileMenu } from '@/components/profile-menu';
import { useSession } from '@/hooks/use-session';
import { colors, fontFamily, fontSize, spacing } from '@/lib/theme';

export function ScreenHeader({ title }: { title: string }) {
  const { session } = useSession();

  return (
    <View style={styles.headerRow}>
      <Text style={styles.title}>{title}</Text>
      {session ? (
        <ProfileMenu />
      ) : (
        <Pressable
          onPress={() => router.push('/profile')}
          style={({ pressed }) => pressed && styles.authLinkPressed}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Text style={styles.authLink}>Profile</Text>
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
    marginTop: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    color: colors.textPrimary,
  },
  authLink: {
    fontSize: fontSize.bodySmall + 1,
    color: colors.accent,
    fontWeight: '600',
  },
  authLinkPressed: {
    opacity: 0.6,
  },
});
