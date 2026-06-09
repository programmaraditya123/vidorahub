import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVibesQuery } from '@/queries';
import { VibeSlide } from '@/features/vibes/components/VibeSlide';
import { Loader } from '@/components/ui/Loader';
import { useVideoStore } from '@/store/videoStore';
import { colors } from '@/theme';
import type { VibeItem } from '@/types';
import type { MainStackParamList, TabParamList } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { logScreenView } from '@/lib/analytics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function VibesScreen() {
  const route = useRoute<RouteProp<TabParamList, 'Vibes'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const muted = useVideoStore((s) => s.muted);
  const setMuted = useVideoStore((s) => s.setMuted);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useVibesQuery();

  useFocusEffect(
    useCallback(() => {
      logScreenView('Vibes');
    }, []),
  );

  const vibes = useMemo(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data],
  ) as VibeItem[];

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
      <FlashList
        data={vibes}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <VibeSlide
            vibe={item}
            isActive={index === activeIndex}
            isMuted={muted}
            onToggleMute={() => setMuted(!muted)}
            onCreatorPress={(id) => navigation.navigate('Channel', { id })}
          />
        )}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
});
