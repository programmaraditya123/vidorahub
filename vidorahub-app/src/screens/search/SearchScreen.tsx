import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSearchVideosQuery } from '@/queries';
import { SearchVideoCard } from '@/features/video/components/SearchVideoCard';
import { Loader } from '@/components/ui/Loader';
import { colors, spacing, typography } from '@/theme';
import { buildVideoSlug } from '@/utils';
import type { VideoItem } from '@/types';
import type { MainStackParamList } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { logScreenView } from '@/lib/analytics';

const COLUMN_GAP = spacing.sm;
const CARD_WIDTH =
  (Dimensions.get('window').width - spacing.md * 2 - COLUMN_GAP) / 2;

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchVideosQuery(debounced);

  useFocusEffect(
    useCallback(() => {
      logScreenView('Search');
    }, []),
  );

  const videos = useMemo(
    () =>
      (data?.pages.flatMap(
        (page) =>
          (page as { data?: VideoItem[]; videos?: VideoItem[] })?.data ??
          (page as { videos?: VideoItem[] })?.videos ??
          [],
      ) ?? []) as VideoItem[],
    [data],
  );

  const handlePress = useCallback(
    (video: VideoItem) => {
      const slug = buildVideoSlug(video.videoUrl ?? '', video._id);
      navigation.navigate('VideoPlayer', { slug, videoId: video._id });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search premium cinematography..."
            placeholderTextColor="#c4b5fd"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textFaint}
              onPress={() => setQuery('')}
            />
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <Loader />
      ) : (
        <FlashList
          data={videos}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.itemWrap,
                {
                  paddingLeft: index % 2 === 0 ? 0 : COLUMN_GAP / 2,
                  paddingRight: index % 2 === 0 ? COLUMN_GAP / 2 : 0,
                },
              ]}
            >
              <SearchVideoCard
                video={item}
                onPress={handlePress}
                width={CARD_WIDTH}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            debounced ? (
              <Text style={styles.emptyText}>No videos found</Text>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.footer}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  navbar: {
    backgroundColor: '#f6f4fb',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    padding: 0,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  itemWrap: {
    flex: 1,
    marginBottom: COLUMN_GAP,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    marginTop: spacing.xxxl,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
