import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radii, spacing } from '@/lib/theme';

// Demo-only: picks a file and shows a "Received" confirmation, per CLAUDE.md's
// constraint that this app must never store or process real financial
// documents. The file is never uploaded or read - just its name, held in
// local state for this screen's lifetime.
export function DocumentUploadSlot({ label }: { label: string }) {
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSelect() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: false,
    });
    if (result.canceled) return;
    setFileName(result.assets[0].name);
  }

  return (
    <View style={styles.card}>
      <View style={styles.textColumn}>
        <Text style={styles.label}>{label}</Text>
        {fileName ? (
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
        ) : (
          <Text style={styles.placeholder}>No file selected</Text>
        )}
      </View>

      {fileName ? (
        <View style={styles.receivedBadge}>
          <Text style={styles.receivedBadgeText}>Received ✓</Text>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.selectButton, pressed && styles.selectButtonPressed]}
          onPress={handleSelect}
          accessibilityRole="button"
          accessibilityLabel={`Select file for ${label}`}
        >
          <Text style={styles.selectButtonText}>Select File</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  textColumn: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    fontSize: fontSize.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  fileName: {
    fontSize: fontSize.bodySmall,
    color: colors.success,
    marginTop: 2,
  },
  selectButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
  },
  selectButtonPressed: {
    opacity: 0.85,
  },
  selectButtonText: {
    color: colors.onDark,
    fontSize: fontSize.bodySmall,
    fontWeight: '600',
  },
  receivedBadge: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  receivedBadgeText: {
    color: colors.success,
    fontSize: fontSize.bodySmall,
    fontWeight: '600',
  },
});
