import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUiStore } from '@/store/uiStore';
import { colors, spacing, typography } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OfflineBanner() {
  const isOffline = useUiStore((s) => s.isOffline);
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + spacing.xs }]}>
      <Text style={styles.text} accessibilityLiveRegion="polite">
        You are offline. Some features may be unavailable.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.royalPurple,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    zIndex: 9998,
  },
  text: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
});
