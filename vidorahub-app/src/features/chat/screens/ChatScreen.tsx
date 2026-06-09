import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

/** Scaffold screen — backend chat/DM APIs not yet in web frontend. */
export function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>
        Real-time messaging architecture is ready. Connect backend chat APIs when available.
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
