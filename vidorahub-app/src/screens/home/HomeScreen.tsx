import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVideosQuery } from '@/queries';
import { VideoCard } from '@/features/video/components/VideoCard';
import { HomeHeader } from '@/components/shared/HomeHeader';
import { Loader } from '@/components/ui/Loader';
import { colors, spacing } from '@/theme';
import { buildVideoSlug } from '@/utils';
import type { VideoItem } from '@/types';
import type { MainStackParamList } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { logScreenView } from '@/lib/analytics';

const CARD_WIDTH = Dimensions.get('window').width - spacing.md * 2;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useVideosQuery();

  useFocusEffect(
    useCallback(() => {
      logScreenView('Home');
    }, []),
  );

  const videos = useMemo(
    () => data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [data],
  );

  const handlePress = useCallback(
    (video: VideoItem) => {
      const slug = buildVideoSlug(video.videoUrl ?? '', video._id);
      navigation.navigate('VideoPlayer', { slug, videoId: video._id });
    },
    [navigation],
  );

  if (isLoading && !videos.length) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <HomeHeader />
        <Loader />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HomeHeader />
      <FlashList
        data={videos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <VideoCard video={item} onPress={handlePress} width={CARD_WIDTH} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
