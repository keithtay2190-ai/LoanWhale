import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Compare' }} />
      <Tabs.Screen name="documents" options={{ title: 'Documents' }} />
      <Tabs.Screen name="status" options={{ title: 'Status' }} />
    </Tabs>
  );
}
