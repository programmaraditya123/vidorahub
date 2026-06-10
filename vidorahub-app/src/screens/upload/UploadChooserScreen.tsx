import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBottomNavigationBar, APP_BOTTOM_BAR_HEIGHT } from '@/components/shared/AppBottomNavigationBar';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';

type UploadRoute = 'UploadVideo' | 'UploadVibe';

function UploadOptionCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
    </Pressable>
  );
}

export function UploadChooserScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();

  const openUpload = (route: UploadRoute) => {
    navigation.navigate(route);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: APP_BOTTOM_BAR_HEIGHT + insets.bottom + spacing.lg },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Ionicons name="cloud-upload" size={28} color={colors.white} />
        </View>
        <Text style={styles.title}>What you want to Upload?</Text>
        <Text style={styles.subtitle}>Choose the content format that fits your story.</Text>
      </View>

      <View style={styles.options}>
        <UploadOptionCard
          icon="film-outline"
          title="Video"
          description="Long-form uploads for tutorials, stories, shows, and creator videos."
          onPress={() => openUpload('UploadVideo')}
        />
        <UploadOptionCard
          icon="flash-outline"
          title="Vibes"
          description="Quick vertical moments designed for short, high-energy clips."
          onPress={() => openUpload('UploadVibe')}
        />
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.noteText}>
          Vibes are designed for quick moments under 60 seconds. For longer content,
          upload using Video.
        </Text>
      </View>
      <AppBottomNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  options: {
    gap: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    borderColor: colors.primary,
  },
  cardIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgMuted,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xxxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
