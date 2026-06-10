import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import type { VideoItem } from '@/types';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { formatDuration, formatViews } from '@/utils';
import { Avatar } from '@/components/ui/Avatar';

type VideoCardProps = {
  video: VideoItem;
  onPress: (video: VideoItem) => void;
  width?: number;
};

export function VideoCard({ video, onPress, width }: VideoCardProps) {
  const cardWidth =
    width ?? (Dimensions.get('window').width - spacing.lg * 2 - spacing.md) / 2;

  const handlePress = useCallback(() => onPress(video), [onPress, video]);

  return (
    <Pressable
      style={[styles.card, { width: cardWidth }]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.title}`}
    >
      <View style={styles.thumbnailWrap}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={video.thumbnailUrl ?? video._id}
          transition={0}
        />
        <View style={styles.thumbnailVignette} />
        {video.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(video.duration)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Avatar
          name={video.uploader?.name ?? 'Creator'}
          uri={video.uploader?.profilePicUrl ?? video.uploader?.profilePicture}
          size={32}
        />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.creator} numberOfLines={1}>
            {video.uploader?.name ?? 'Creator'}
          </Text>
          <Text style={styles.views}>
            {formatViews(video.stats?.views ?? 0)} views
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
    ...shadows.sm,
  },
  thumbnailWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#f3eeff',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(15, 5, 30, 0.12)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(10, 5, 20, 0.78)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 7,
  },
  durationText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  info: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    lineHeight: 18,
    color: '#1a1a2e',
    letterSpacing: -0.1,
  },
  creator: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 1,
  },
  views: {
    fontSize: typography.sizes.xs,
    color: '#9ca3af',
    fontWeight: '500',
  },
});
