import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChannelQuery, useProductsQuery } from '@/queries';
import { VideoCard } from '@/features/video/components/VideoCard';
import { ProductCard } from '@/features/store/components/ProductCard';
import { Avatar } from '@/components/ui/Avatar';
import { Loader } from '@/components/ui/Loader';
import { colors, spacing, typography } from '@/theme';
import { buildVideoSlug, formatViews } from '@/utils';
import type { VideoItem } from '@/types';
import type { MainStackParamList } from '@/navigation/types';
import { Pressable } from 'react-native';

export function ChannelScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'Channel'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [tab, setTab] = useState<'videos' | 'store'>(route.params.tab ?? 'videos');

  const { data, isLoading } = useChannelQuery(route.params.id);
  const profile = data?.data;
  const { data: products = [] } = useProductsQuery(route.params.id);

  const handleVideoPress = useCallback(
    (video: VideoItem) => {
      navigation.navigate('VideoPlayer', {
        slug: buildVideoSlug(video.videoUrl ?? '', video._id),
        videoId: video._id,
      });
    },
    [navigation],
  );

  if (isLoading || !profile) {
    return <Loader />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar name={profile.name} uri={profile.profilePicUrl} size={80} />
        <Text style={styles.name}>{profile.name}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        <Text style={styles.stats}>
          {formatViews(profile.subscriber)} subscribers · {profile.totalvideos} videos
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'videos' && styles.tabActive]}
          onPress={() => setTab('videos')}
        >
          <Text style={[styles.tabText, tab === 'videos' && styles.tabTextActive]}>Videos</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'store' && styles.tabActive]}
          onPress={() => setTab('store')}
        >
          <Text style={[styles.tabText, tab === 'store' && styles.tabTextActive]}>Store</Text>
        </Pressable>
      </View>

      {tab === 'videos' ? (
        <FlatList
          data={profile.uploads ?? []}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <VideoCard video={item} onPress={handleVideoPress} />
            </View>
          )}
        />
      ) : products.length ? (
        <ProductCard products={products} ownerId={route.params.id} />
      ) : (
        <Text style={styles.emptyStore}>No products in this store yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSubtle },
  content: { padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  name: {
    marginTop: spacing.md,
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bio: { marginTop: spacing.sm, color: colors.textMuted, textAlign: 'center' },
  stats: { marginTop: spacing.sm, color: colors.textFaint },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  gridItem: { flex: 1, padding: spacing.xs },
  emptyStore: {
    textAlign: 'center',
    color: colors.textFaint,
    paddingVertical: spacing.xxxl,
  },
});
