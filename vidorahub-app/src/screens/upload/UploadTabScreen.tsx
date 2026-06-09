import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { AuthModal } from '@/components/shared/AuthModal';
import { colors, spacing, typography } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';

export function UploadTabScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setRedirect = useAuthStore((s) => s.setRedirectAfterLogin);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleUpload = useCallback(() => {
    if (!isAuthenticated) {
      setRedirect('upload');
      setShowAuthModal(true);
      return;
    }
    navigation.navigate('UploadChooser');
  }, [isAuthenticated, navigation, setRedirect]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Content</Text>
      <Text style={styles.subtitle}>Upload long-form videos or short Vibes</Text>
      <Button title="Start Upload" onPress={handleUpload} />
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={() => {
          setShowAuthModal(false);
          navigation.navigate('Login');
        }}
        onSignup={() => {
          setShowAuthModal(false);
          navigation.navigate('Signup');
        }}
      />
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    marginBottom: spacing.xxxl,
    textAlign: 'center',
  },
});
