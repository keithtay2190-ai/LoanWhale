import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

// Plain-View placeholder avatar (head + shoulders silhouette) so we don't need
// an image asset or an SVG library for a generic default profile icon.
function AvatarIcon({ size = 32 }: { size?: number }) {
  return (
    <View
      style={[
        styles.avatarOuter,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.avatarHead,
          {
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: (size * 0.42) / 2,
            marginTop: size * 0.14,
          },
        ]}
      />
      <View
        style={[
          styles.avatarShoulders,
          {
            width: size * 0.86,
            height: size * 0.56,
            borderRadius: size * 0.43,
            bottom: -size * 0.08,
          },
        ]}
      />
    </View>
  );
}

export function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <AvatarIcon />
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
  avatarOuter: {
    backgroundColor: '#D3DCDD',
    overflow: 'hidden',
    alignItems: 'center',
  },
  avatarHead: {
    backgroundColor: '#84ACB6',
  },
  avatarShoulders: {
    position: 'absolute',
    backgroundColor: '#84ACB6',
    alignSelf: 'center',
  },
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
