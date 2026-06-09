import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, typography } from '@/theme';

type AuthModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
  message?: string;
};

export function AuthModal({
  visible,
  onClose,
  onLogin,
  onSignup,
  message = 'Sign in to continue',
}: AuthModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{message}</Text>
          <Text style={styles.subtitle}>
            Join VidoraHub to like, comment, follow creators, and upload content.
          </Text>
          <Button title="Sign In" onPress={onLogin} style={styles.button} />
          <Button
            title="Create Account"
            variant="secondary"
            onPress={onSignup}
            style={styles.button}
          />
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  content: {
    backgroundColor: colors.bg,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  button: {
    marginBottom: spacing.md,
  },
});
