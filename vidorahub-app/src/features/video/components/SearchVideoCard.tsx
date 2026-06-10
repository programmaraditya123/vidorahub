import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import type { VideoItem } from '@/types';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { formatDuration } from '@/utils';

type SearchVideoCardProps = {
  video: VideoItem;
  onPress: (video: VideoItem) => void;
  width: number;
};

export function SearchVideoCard({ video, onPress, width }: SearchVideoCardProps) {
  const handlePress = useCallback(() => onPress(video), [onPress, video]);

  return (
    <Pressable
      style={[styles.card, { width }]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.title}`}
    >
      <View style={styles.thumb}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={video.thumbnailUrl ?? video._id}
          transition={0}
        />
        {video.duration ? (
          <View style={styles.duration}>
            <Text style={styles.durationText}>
              {formatDuration(video.duration)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.08)',
    ...shadows.sm,
  },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#f3eeff',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  duration: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
});
