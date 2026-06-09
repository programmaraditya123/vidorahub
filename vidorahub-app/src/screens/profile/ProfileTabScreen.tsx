import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/authStore';
import { ProfileScreen } from './ProfileScreen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme';
import { Text } from 'react-native';
import type { MainStackParamList } from '@/navigation/types';

export function ProfileTabScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  if (!isAuthenticated) {
    return (
      <View style={styles.guest}>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Sign in to view your channel, uploads, and store.</Text>
        <Button title="Sign In" onPress={() => navigation.navigate('Login')} />
        <Button
          title="Create Account"
          variant="secondary"
          onPress={() => navigation.navigate('Signup')}
          style={styles.btn}
        />
      </View>
    );
  }

  return <ProfileScreen />;
}

const styles = StyleSheet.create({
  guest: {
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  btn: { marginTop: spacing.md, width: '100%' },
});
