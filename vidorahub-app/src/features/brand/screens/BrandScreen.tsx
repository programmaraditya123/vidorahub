import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

/** Scaffold — brand profiles not separate from creator channels in web. */
export function BrandScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brand Profiles</Text>
      <Text style={styles.subtitle}>
        Brand profile pages will be available when the web platform adds brand-specific routes.
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
