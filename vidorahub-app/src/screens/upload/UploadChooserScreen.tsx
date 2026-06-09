import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';

export function UploadChooserScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What would you like to upload?</Text>
      <Button
        title="Long-form Video"
        onPress={() => navigation.navigate('UploadVideo')}
        style={styles.btn}
      />
      <Button
        title="Vibe (under 60s)"
        variant="secondary"
        onPress={() => navigation.navigate('UploadVibe')}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xxl,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xxxl,
    textAlign: 'center',
  },
  btn: { marginBottom: spacing.lg },
});
