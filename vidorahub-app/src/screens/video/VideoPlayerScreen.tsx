import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
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
import { AppBottomNavigationBar, APP_BOTTOM_BAR_HEIGHT } from '@/components/shared/AppBottomNavigationBar';
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
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
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

  const activeTabIndex = TABS.indexOf(activeTab);

  const switchTab = useCallback(
    (tab: Tab) => {
      const nextIndex = TABS.indexOf(tab);
      setActiveTab(tab);
      pagerRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    },
    [width],
  );

  const handlePagerMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      const nextTab = TABS[Math.max(0, Math.min(TABS.length - 1, nextIndex))];
      setActiveTab(nextTab);
    },
    [width],
  );

  useEffect(() => {
    pagerRef.current?.scrollTo({ x: activeTabIndex * width, animated: false });
  }, [activeTabIndex, width]);

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
  const tabContentStyle = [
    styles.bodyContent,
    { paddingBottom: APP_BOTTOM_BAR_HEIGHT + insets.bottom + spacing.xl },
  ];

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
            onPress={() => switchTab(tab)}
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
        ref={pagerRef}
        style={styles.pager}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerMomentumEnd}
      >
        <ScrollView
          style={[styles.page, { width }]}
          contentContainerStyle={tabContentStyle}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>

        <ScrollView
          style={[styles.page, { width }]}
          contentContainerStyle={tabContentStyle}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabPanel}>
            <UpNextSidebar videoId={videoId} embedded />
          </View>
        </ScrollView>

        <ScrollView
          style={[styles.page, { width }]}
          contentContainerStyle={tabContentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.tabPanel}>
            <CommentSection videoId={videoId} embedded />
          </View>
        </ScrollView>
      </ScrollView>
      <AppBottomNavigationBar />
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
  pager: {
    flex: 1,
    backgroundColor: colors.white,
  },
  page: {
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
