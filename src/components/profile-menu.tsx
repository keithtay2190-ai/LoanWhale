import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { useProfile } from '@/context/profile-context';
import { supabase } from '@/lib/supabase';
import { colors, fontSize, radii, spacing } from '@/lib/theme';

export function ProfileMenu() {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => pressed && styles.avatarPressed}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
      >
        <Avatar url={profile?.avatarUrl} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close menu"
        >
          <View style={styles.menu}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => {
                setOpen(false);
                router.push('/profile');
              }}
              accessibilityRole="button"
              accessibilityLabel="Profile details"
            >
              <Text style={styles.menuItemText}>Details</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => {
                setOpen(false);
                supabase.auth.signOut();
              }}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Text style={styles.menuItemText}>Log Out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarPressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuItemPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  menuItemText: {
    fontSize: fontSize.bodySmall + 1,
    color: colors.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
