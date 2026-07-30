import { Image, StyleSheet, View } from 'react-native';

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
    backgroundColor: '#D3DCDD',
    overflow: 'hidden',
    alignItems: 'center',
  },
  head: {
    backgroundColor: '#84ACB6',
  },
  shoulders: {
    position: 'absolute',
    backgroundColor: '#84ACB6',
    alignSelf: 'center',
  },
});
