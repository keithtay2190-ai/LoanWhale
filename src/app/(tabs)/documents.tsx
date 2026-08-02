import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentUploadSlot } from '@/components/document-upload-slot';
import { ScreenHeader } from '@/components/screen-header';

export default function DocumentsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Documents" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Demo only — files aren't uploaded or stored.</Text>

        <View style={styles.list}>
          <DocumentUploadSlot label="Credit Bureau Score Report" />
          <DocumentUploadSlot label="Income Statement" />
          <DocumentUploadSlot label="Bank Statements" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  list: {
    gap: 10,
  },
});
