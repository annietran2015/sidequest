import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const TABS: TabConfig[] = [
  {
    name: 'index',
    title: 'Home',
    icon: 'home-outline',
    iconFocused: 'home',
  },
  {
    name: 'log',
    title: 'Log',
    icon: 'scroll-outline',
    iconFocused: 'scroll',
  },
  {
    name: 'friends',
    title: 'Friends',
    icon: 'people-outline',
    iconFocused: 'people',
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    iconFocused: 'person',
  },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.terracotta,
        tabBarInactiveTintColor: COLORS.barkMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.cream,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 8,
    height: 64,
    shadowColor: COLORS.bark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
});
