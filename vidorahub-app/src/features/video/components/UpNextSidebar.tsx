import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from '@/components/native/Image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUpNextQuery } from '@/queries';
import { Loader } from '@/components/ui/Loader';
import { colors, radius, spacing, typography } from '@/theme';
import { buildVideoSlug, formatDuration, formatViews } from '@/utils';
import type { MainStackParamList } from '@/navigation/types';
import type { VideoItem } from '@/types';

type Props = {
  videoId: string;
  embedded?: boolean;
};

export function UpNextSidebar({ videoId, embedded = false }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data, isLoading } = useUpNextQuery(videoId);

  const videos: VideoItem[] =
    (data as { data?: VideoItem[]; videos?: VideoItem[] })?.data ??
    (data as { videos?: VideoItem[] })?.videos ??
    [];

  const handleNavigate = useCallback(
    (video: VideoItem) => {
      navigation.push('VideoPlayer', {
        slug: buildVideoSlug(video.videoUrl ?? '', video._id),
        videoId: video._id,
      });
    },
    [navigation],
  );

  return (
    <View style={[styles.sidebar, embedded && styles.embedded]}>
      <Text style={styles.heading}>Up Next</Text>

      {isLoading ? (
        <Loader size="small" />
      ) : (
        <View style={styles.list}>
          {videos.map((v) => (
            <Pressable
              key={v._id}
              style={styles.item}
              onPress={() => handleNavigate(v)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${v.title}`}
            >
              <View style={styles.thumbWrapper}>
                <Image
                  source={{ uri: v.thumbnailUrl }}
                  style={styles.thumbnail}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={v.thumbnailUrl ?? v._id}
                  transition={0}
                />
                {v.duration ? (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      {formatDuration(v.duration)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.meta}>
                <Text style={styles.title} numberOfLines={2}>
                  {v.title}
                </Text>
                <View style={styles.sub}>
                  <Text style={styles.subText} numberOfLines={1}>
                    {v.uploader?.name ?? 'Unknown'}
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.subText}>
                    {formatViews(v.stats?.views ?? 0)} views
                  </Text>
                </View>
                {v.createdAt ? (
                  <Text style={styles.upload}>
                    {new Date(v.createdAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}

          {videos.length === 0 ? (
            <Text style={styles.empty}>Nothing up next.</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  embedded: {
    padding: 0,
  },
  heading: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumbWrapper: {
    width: 140,
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgSubtle,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(10, 5, 20, 0.78)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  sub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  subText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    flexShrink: 1,
  },
  dot: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
  },
  upload: {
    fontSize: typography.sizes.xs,
    color: colors.textFaint,
    marginTop: 1,
  },
  empty: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
