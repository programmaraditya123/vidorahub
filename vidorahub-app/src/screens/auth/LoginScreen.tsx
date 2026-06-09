import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GoogleSignin,
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import { useLoginMutation, useGoogleLoginMutation } from '@/mutations';
import { useToast } from '@/providers/ToastProvider';
import { AuthInput } from '@/components/ui/AuthInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { AuthLayout, AuthNavLinks } from '@/components/shared/AuthLayout';
import { useAuthStore } from '@/store/authStore';
import { config } from '@/config';
import { colors, spacing, typography } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { AuthStackParamList } from '@/navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp as NSNav } from '@react-navigation/native-stack';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

type Nav = CompositeNavigationProp<
  NSNav<MainStackParamList>,
  NSNav<AuthStackParamList>
>;

GoogleSignin.configure({
  webClientId: config.googleClientId,
  offlineAccess: false,
});

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { success, error: toastError } = useToast();
  const consumeRedirect = useAuthStore((s) => s.consumeRedirect);
  const loginMutation = useLoginMutation();
  const googleMutation = useGoogleLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSuccessNavigate = useCallback(() => {
    const redirect = consumeRedirect();
    success('Logged in successfully!');
    if (redirect) {
      navigation.goBack();
    } else {
      navigation.navigate('Tabs' as never);
    }
  }, [consumeRedirect, navigation, success]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const res = await loginMutation.mutateAsync(data);
        if (!res.success) {
          toastError(res.message ?? 'Wrong email or password');
          return;
        }
        onSuccessNavigate();
      } catch (err: unknown) {
        toastError((err as { message?: string })?.message ?? 'Login failed');
      }
    },
    [loginMutation, onSuccessNavigate, toastError],
  );

  const handleGoogle = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (!idToken) {
        toastError('Google sign-in failed');
        return;
      }
      const res = await googleMutation.mutateAsync(idToken);
      if (!res.success) {
        toastError(res.message ?? 'Google login failed');
        return;
      }
      onSuccessNavigate();
    } catch {
      toastError('Google sign-in cancelled or failed');
    }
  }, [googleMutation, onSuccessNavigate, toastError]);

  return (
    <AuthLayout navRight={<AuthNavLinks />}>
      <View style={styles.header}>
        <Text style={styles.portal}>PORTAL INTERFACE</Text>
        <Text style={styles.title}>Login</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthInput
              label="Email"
              placeholder="Email address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthInput
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        {config.googleClientId ? (
          <View style={styles.googleWrap}>
            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={handleGoogle}
              disabled={googleMutation.isPending}
            />
          </View>
        ) : null}

        <GradientButton
          title="Enter Hub"
          onPress={handleSubmit(onSubmit)}
          loading={loginMutation.isPending}
          style={styles.submit}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don&apos;t have an account?{' '}
          <Text
            style={styles.footerLink}
            onPress={() => navigation.navigate('Signup')}
          >
            Sign up for VidoraHub
          </Text>
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xxl,
  },
  portal: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  form: {
    gap: spacing.lg,
  },
  googleWrap: {
    alignItems: 'center',
  },
  submit: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});
