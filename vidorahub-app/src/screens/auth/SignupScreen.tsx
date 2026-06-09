import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterMutation } from '@/mutations';
import { useToast } from '@/providers/ToastProvider';
import { AuthInput } from '@/components/ui/AuthInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { AuthLayout } from '@/components/shared/AuthLayout';
import { colors, spacing, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export function SignupScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { success, error: toastError } = useToast();
  const registerMutation = useRegisterMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const res = await registerMutation.mutateAsync(data);
        if (!res.success) {
          toastError(res.message ?? 'Registration failed');
          return;
        }
        success('Account created successfully!');
        navigation.navigate('Login');
      } catch (err: unknown) {
        toastError(
          (err as { message?: string })?.message ?? 'Registration failed',
        );
      }
    },
    [registerMutation, navigation, success, toastError],
  );

  return (
    <AuthLayout
      navRight={
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={styles.loginLink}>Log In</Text>
        </Pressable>
      }
    >
      <View style={styles.header}>
        <Text style={styles.portal}>GET STARTED</Text>
        <Text style={styles.title}>Create Account</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthInput
              label="Your Name"
              placeholder="Display name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthInput
              label="Email address"
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

        <GradientButton
          title="Create Account"
          onPress={handleSubmit(onSubmit)}
          loading={registerMutation.isPending}
          style={styles.submit}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text
            style={styles.footerLink}
            onPress={() => navigation.navigate('Login')}
          >
            Log in to VidoraHub
          </Text>
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loginLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
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
