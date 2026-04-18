import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Home, Layers, MessageSquare, User } from 'lucide-react-native';
import { colors } from '../../src/constants/theme';

function TabIcon({ Icon, label, focused }: { Icon: any; label: string; focused: boolean }) {
  const color = focused ? colors.primary : 'rgba(100,116,139,0.8)';
  return (
    <View style={styles.tabItem}>
      <Icon size={22} color={color} fill={focused ? color : 'none'} />
      {focused && <View style={styles.indicator} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tabs.Screen name="home" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home} label="Home" focused={focused} /> }} />
      <Tabs.Screen name="capsules" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Layers} label="Capsules" focused={focused} /> }} />
      <Tabs.Screen name="chat" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={MessageSquare} label="Chat" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User} label="Profile" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'rgba(5,16,17,0.95)',
    borderTopWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 76,
    paddingBottom: 12,
    paddingTop: 10,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  tabItem: { alignItems: 'center', width: 64 },
  indicator: { width: 28, height: 2, backgroundColor: colors.primary, borderRadius: 1, marginTop: 2, shadowColor: '#00F0FF', shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  tabLabel: { fontSize: 9, letterSpacing: 2, fontWeight: '500', marginTop: 3, textTransform: 'uppercase' },
});
