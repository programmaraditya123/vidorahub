import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, radius } from '@/theme';
import { userValidates } from '@/store/authStore';
import type { MainStackParamList } from '@/navigation/types';

const ABOUT_URL = 'https://about.vidorahub.com/';

export function HomeHeader() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const handleAbout = useCallback(() => {
    Linking.openURL(ABOUT_URL).catch(() => {});
  }, []);

  const handleAction = useCallback(() => {
    if (userValidates()) {
      navigation.navigate('UploadChooser');
    } else {
      navigation.navigate('Login');
    }
  }, [navigation]);

  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Ionicons name="play-circle" size={26} color={colors.primary} />
        <Text style={styles.logoText}>VidoraHub</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.outlineBtn}
          onPress={handleAbout}
          accessibilityRole="button"
        >
          <Text style={styles.outlineBtnText}>About</Text>
        </Pressable>
        <Pressable
          style={styles.outlineBtn}
          onPress={handleAction}
          accessibilityRole="button"
        >
          <Text style={styles.outlineBtnText}>
            {userValidates() ? 'Upload' : 'Login'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: '#f6f4fb',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.1)',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  outlineBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
});
