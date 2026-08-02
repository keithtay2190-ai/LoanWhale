import { Image, StyleSheet, View } from 'react-native';

import { colors } from '@/lib/theme';

export function Avatar({ url, size = 32 }: { url?: string | null; size?: number }) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  // Plain-View placeholder (head + shoulders silhouette) so we don't need an
  // image asset or an SVG library for the generic default profile icon.
  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={[
          styles.head,
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
          styles.shoulders,
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

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
  },
  head: {
    backgroundColor: colors.textMuted,
  },
  shoulders: {
    position: 'absolute',
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
  },
});
