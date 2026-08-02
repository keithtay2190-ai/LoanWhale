import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Pressable style={styles.selectButton} onPress={handleSelect}>
          <Text style={styles.selectButtonText}>Select File</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textColumn: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  fileName: {
    fontSize: 13,
    color: '#2a7a2a',
    marginTop: 2,
  },
  selectButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  receivedBadge: {
    backgroundColor: '#f3faf3',
    borderWidth: 1,
    borderColor: '#d5ead5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  receivedBadgeText: {
    color: '#2a7a2a',
    fontSize: 13,
    fontWeight: '600',
  },
});
