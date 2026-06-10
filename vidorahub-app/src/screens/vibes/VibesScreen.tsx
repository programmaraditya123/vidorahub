import React, { useState, useCallback, useMemo } from 'react';
import { AppState, View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVibesQuery } from '@/queries';
import { VibeSlide } from '@/features/vibes/components/VibeSlide';
import { Loader } from '@/components/ui/Loader';
import { useVideoStore } from '@/store/videoStore';
import { colors, spacing, typography } from '@/theme';
import type { VibeItem } from '@/types';
import type { MainStackParamList, TabParamList } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { logScreenView } from '@/lib/analytics';

export function VibesScreen() {
  const route = useRoute<RouteProp<TabParamList, 'Vibes'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isFocused = useIsFocused();
  const { height } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const muted = useVideoStore((s) => s.muted);
  const setMuted = useVideoStore((s) => s.setMuted);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAppActive, setIsAppActive] = useState(true);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useVibesQuery();

  useFocusEffect(
    useCallback(() => {
      logScreenView('Vibes');
    }, []),
  );

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setIsAppActive(state === 'active');
    });

    return () => subscription.remove();
  }, []);

  const vibes = useMemo(
    () =>
      data?.pages.flatMap((page) => {
        const withData = page as { data?: VibeItem[]; items?: VibeItem[] };
        return withData.data ?? withData.items ?? [];
      }) ?? [],
    [data],
  ) as VibeItem[];
  const slideHeight = Math.max(1, height - tabBarHeight);
  const canPlay = isFocused && isAppActive;

  const initialVibeId = route.params?.initialVibeId;
  const initialIndex = initialVibeId
    ? vibes.findIndex((v) => v._id === initialVibeId)
    : 0;

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const index = viewableItems[0]?.index;
      if (index != null) setActiveIndex(index);
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 60 }),
    [],
  );

  if (isLoading && !vibes.length) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      {vibes.length ? (
        <FlashList
          data={vibes}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <VibeSlide
              vibe={item}
              isActive={canPlay && index === activeIndex}
              isMuted={muted}
              slideHeight={slideHeight}
              onToggleMute={() => setMuted(!muted)}
              onCreatorPress={(id) => navigation.navigate('Channel', { id })}
            />
          )}
          pagingEnabled
          snapToInterval={slideHeight}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={[styles.loadingMore, { height: slideHeight }]}>
                <View style={styles.loadingDot} />
                <View style={styles.loadingDot} />
                <View style={styles.loadingDot} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No vibes yet</Text>
          <Text style={styles.emptyText}>Short videos will appear here as creators upload them.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.black,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: '800',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
