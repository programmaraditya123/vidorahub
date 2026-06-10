import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainStackParamList, TabParamList } from '@/navigation/types';
import { colors, typography } from '@/theme';

export const APP_BOTTOM_BAR_HEIGHT = 60;

const NAV_ITEMS: Array<{
  label: string;
  screen: keyof TabParamList;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { label: 'Home', screen: 'Home', icon: 'home-outline' },
  { label: 'Search', screen: 'Search', icon: 'search-outline' },
  { label: 'Vibes', screen: 'Vibes', icon: 'flash-outline' },
  { label: 'Earn', screen: 'EarnTab', icon: 'wallet-outline' },
  { label: 'Profile', screen: 'ProfileTab', icon: 'person-outline' },
];

export function AppBottomNavigationBar() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomBar,
        {
          height: APP_BOTTOM_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {NAV_ITEMS.map((item) => (
        <Pressable
          key={item.screen}
          style={styles.navItem}
          onPress={() => navigation.navigate('Tabs', { screen: item.screen })}
          accessibilityRole="tab"
          accessibilityState={{ selected: false }}
        >
          <Ionicons name={item.icon} size={22} color={colors.textFaint} />
          <Text style={styles.navLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
  },
  navItem: {
    flex: 1,
    minHeight: APP_BOTTOM_BAR_HEIGHT - 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.textFaint,
  },
});
