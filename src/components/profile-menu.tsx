import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { useProfile } from '@/context/profile-context';
import { supabase } from '@/lib/supabase';

export function ProfileMenu() {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <Avatar url={profile?.avatarUrl} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                router.push('/profile');
              }}
            >
              <Text style={styles.menuItemText}>Details</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                supabase.auth.signOut();
              }}
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#111',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#eee',
  },
});
