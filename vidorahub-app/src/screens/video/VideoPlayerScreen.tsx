import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useVideoQuery } from '@/queries';
import { VideoPlayer } from '@/features/video/components/VideoPlayer';
import { VideoMeta } from '@/features/video/components/VideoMeta';
import { VideoActions } from '@/features/video/components/VideoActions';
import { VideoDescription } from '@/features/video/components/VideoDescription';
import { UpNextSidebar } from '@/features/video/components/UpNextSidebar';
import { CommentSection } from '@/features/video/components/CommentSection';
import { Loader } from '@/components/ui/Loader';
import { colors, spacing, typography } from '@/theme';
import { parseVideoSlug } from '@/utils';
import { logScreenView } from '@/lib/analytics';
import type { MainStackParamList } from '@/navigation/types';
import type { Uploader, VideoItem } from '@/types';

const TABS = ['Info', 'Up Next', 'Comments'] as const;
type Tab = (typeof TABS)[number];

const FALLBACK_UPLOADER: Uploader = {
  _id: '',
  name: 'Unknown Creator',
  subscriber: 0,
  userSerialNumber: 0,
};

export function VideoPlayerScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'VideoPlayer'>>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('Info');

  const videoId =
    route.params.videoId ??
    (() => {
      try {
        return parseVideoSlug(route.params.slug).videoId;
      } catch {
        return route.params.slug.slice(-24);
      }
    })();

  const { data, isLoading } = useVideoQuery(videoId);

  useFocusEffect(
    useCallback(() => {
      logScreenView('VideoPlayer');
    }, []),
  );

  const video: VideoItem | undefined = data?.data ?? data;

  if (isLoading || !video) {
    return <Loader />;
  }

  const uploader = video.uploader ?? FALLBACK_UPLOADER;
  const category = video.tags?.[0] || video.category || 'General';
  const published = video.createdAt
    ? new Date(video.createdAt).toDateString()
    : '';
  const views = (video.stats?.views ?? 0).toLocaleString();

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />
      <View style={styles.playerWrap}>
        <VideoPlayer video={video} autoPlay />
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabActive]}>
              {tab}
            </Text>
            {activeTab === tab ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Info' ? (
          <View style={styles.infoBlock}>
            <VideoMeta
              title={video.title}
              category={category}
              published={published}
              uploader={uploader}
            />
            <VideoActions
              videoSerialNumber={video.videoSerialNumber ?? 0}
              thumbnailUrl={video.thumbnailUrl ?? ''}
              videoId={videoId}
            />
            <VideoDescription
              views={views}
              uploaded={published}
              hashtags={video.tags}
              description={video.description ?? ''}
            />
          </View>
        ) : null}

        {activeTab === 'Up Next' ? (
          <View style={styles.tabPanel}>
            <UpNextSidebar videoId={videoId} embedded />
          </View>
        ) : null}

        {activeTab === 'Comments' ? (
          <View style={styles.tabPanel}>
            <CommentSection videoId={videoId} embedded />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  statusBarSpacer: {
    backgroundColor: colors.white,
  },
  playerWrap: {
    width: '100%',
    backgroundColor: colors.white,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    width: '60%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  body: {
    flex: 1,
    backgroundColor: colors.white,
  },
  bodyContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  infoBlock: {
    gap: spacing.xl,
  },
  tabPanel: {
    flex: 1,
  },
});
