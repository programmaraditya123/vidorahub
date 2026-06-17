import React, { type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography, shadows } from '@/theme';

type AuthLayoutProps = {
  navRight: ReactNode;
  children: ReactNode;
};

const ABOUT_URL = 'https://about.vidorahub.com/aboutus';
const TERMS_URL = 'https://about.vidorahub.com/privacypolicy';

export function AuthLayout({ navRight, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <View style={[styles.navbar, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.brand}>
          <Ionicons name="play-circle" size={26} color={colors.primary} />
          <Text style={styles.brandText}>VidoraHub</Text>
        </View>
        {navRight}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function AuthNavLinks() {
  return (
    <View style={styles.links}>
      <Pressable
        onPress={() => Linking.openURL(ABOUT_URL).catch(() => {})}
        hitSlop={8}
      >
        <Text style={styles.linkText}>About</Text>
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
        hitSlop={8}
      >
        <Text style={styles.linkText}>Terms</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: { flex: 1 },
  blobTop: {
    position: 'absolute',
    top: 60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
  },
  navbar: {
    backgroundColor: '#f6f4fb',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandText: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.4,
  },
  links: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    ...shadows.md,
  },
});
