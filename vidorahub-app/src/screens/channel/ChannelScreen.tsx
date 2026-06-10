import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChannelQuery, useProductsQuery } from '@/queries';
import { Loader } from '@/components/ui/Loader';
import type { MainStackParamList } from '@/navigation/types';
import { CreatorProfileView } from '@/screens/profile/CreatorProfileView';
import { AppBottomNavigationBar, APP_BOTTOM_BAR_HEIGHT } from '@/components/shared/AppBottomNavigationBar';
import { colors } from '@/theme';

export function ChannelScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'Channel'>>();
  const insets = useSafeAreaInsets();
  const channelId = route.params.id;

  const { data, isLoading } = useChannelQuery(channelId);
  const profile = data?.data;
  const { data: products = [] } = useProductsQuery(channelId);

  if (isLoading || !profile) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <CreatorProfileView
        profile={profile}
        products={products}
        ownerId={channelId}
        initialTab={route.params.tab ?? 'videos'}
        contentBottomPadding={APP_BOTTOM_BAR_HEIGHT + insets.bottom + 24}
        videosEmptyText="No videos uploaded yet."
        storeEmptyText="No products in this store yet."
      />
      <AppBottomNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
