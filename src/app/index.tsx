import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LoanWhale</Text>
      <Text style={styles.subtitle}>Compare loans, simply.</Text>
      <Text style={styles.demoLabel}>Demo App — Portfolio Project</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  demoLabel: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#999',
  },
});
