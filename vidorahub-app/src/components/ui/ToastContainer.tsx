import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, spacing, typography } from '@/theme';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Pressable
          key={toast.id}
          style={[styles.toast, styles[toast.type]]}
          onPress={() => dismiss(toast.id)}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.text}>{toast.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    gap: spacing.sm,
  },
  toast: {
    padding: spacing.lg,
    borderRadius: radius.md,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.error },
  info: { backgroundColor: colors.primary },
  text: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: '500',
  },
});
