import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

/** Scaffold — marketplace/campaigns not in current web frontend. */
export function MarketplaceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creator Marketplace</Text>
      <Text style={styles.subtitle}>
        Campaign discovery and brand partnerships will appear here when backend APIs are available.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.bgSubtle,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 22,
  },
});
