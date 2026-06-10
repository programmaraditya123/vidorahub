import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppBottomNavigationBar, APP_BOTTOM_BAR_HEIGHT } from '@/components/shared/AppBottomNavigationBar';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';

const MAX_VIDEO_SIZE_MB = 2048;
const MAX_VIBE_DURATION_SECONDS = 60;

type UploadSelectScreenProps = {
  contentType: 'video' | 'vibe';
};

export function UploadSelectScreen({ contentType }: UploadSelectScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const isVibe = contentType === 'vibe';

  const pickVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      videoMaxDuration: isVibe ? MAX_VIBE_DURATION_SECONDS : undefined,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const duration = (asset.duration ?? 0) / 1000;
    const sizeMb = asset.fileSize ? asset.fileSize / (1024 * 1024) : undefined;

    if (isVibe && duration > MAX_VIBE_DURATION_SECONDS) {
      Alert.alert('Too long', 'Vibes must be under 60 seconds.');
      return;
    }

    if (sizeMb && sizeMb > MAX_VIDEO_SIZE_MB) {
      Alert.alert('File too large', `Max allowed size is ${MAX_VIDEO_SIZE_MB} MB.`);
      return;
    }

    navigation.navigate('UploadDetails', {
      contentType,
      videoUri: asset.uri,
      videoFileName: asset.fileName ?? (isVibe ? 'vibe.mp4' : 'video.mp4'),
      videoContentType: asset.mimeType ?? 'video/mp4',
      duration,
      sizeMb,
    });
  }, [contentType, isVibe, navigation]);

  return (
    <View
      style={[
        styles.screen,
        { paddingBottom: APP_BOTTOM_BAR_HEIGHT + insets.bottom + spacing.lg },
      ]}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name={isVibe ? 'flash' : 'film'} size={28} color={colors.white} />
        </View>
        <Text style={styles.title}>{isVibe ? 'Upload Your Vibe' : 'Upload Your Video'}</Text>
        <Text style={styles.subtitle}>
          {isVibe
            ? 'Select a short vertical video. After selection, you will add details on the next screen.'
            : 'Select your video file. After selection, you will add details on the next screen.'}
        </Text>
      </View>

      <Pressable style={styles.uploadBox} onPress={pickVideo} accessibilityRole="button">
        <View style={styles.uploadIcon}>
          <Ionicons name="cloud-upload-outline" size={38} color={colors.primary} />
        </View>
        <Text style={styles.uploadTitle}>Select file</Text>
        <Text style={styles.uploadCopy}>
          {isVibe
            ? 'Choose a video under 60 seconds from your device.'
            : 'Choose MP4, MOV, WebM, MKV, or similar video files.'}
        </Text>
      </Pressable>
      <AppBottomNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgSubtle,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
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
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing.xxxl,
    alignItems: 'center',
    ...shadows.sm,
  },
  uploadIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  uploadTitle: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
  },
  uploadCopy: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
