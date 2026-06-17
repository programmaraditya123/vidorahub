import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { SearchScreen } from '@/screens/search/SearchScreen';
import { VibesScreen } from '@/screens/vibes/VibesScreen';
import { EarnScreen } from '@/screens/earn/EarnScreen';
import { ProfileTabScreen } from '@/screens/profile/ProfileTabScreen';
import { colors, typography } from '@/theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline',
            Search: 'search-outline',
            Vibes: 'flash-outline',
            EarnTab: 'wallet-outline',
            ProfileTab: 'person-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="Vibes" component={VibesScreen} options={{ tabBarLabel: 'Vibes' }} />
      <Tab.Screen name="EarnTab" component={EarnScreen} options={{ tabBarLabel: 'Earn' }} />
      <Tab.Screen name="ProfileTab" component={ProfileTabScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
