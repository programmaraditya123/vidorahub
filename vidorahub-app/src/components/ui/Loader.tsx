import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme';

export function Loader({ size = 'large' }: { size?: 'small' | 'large' }) {
  return (
    <View style={styles.container} accessibilityLabel="Loading">
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
