import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useProfileQuery, useProductsQuery } from '@/queries';
import { Loader } from '@/components/ui/Loader';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/providers/ToastProvider';
import { config } from '@/config';
import { deleteVideo } from '@/services/api/authApi';
import { QUERY_KEYS } from '@/constants';
import {
  CreatorProfileView,
  type CreatorProfileTab,
} from './CreatorProfileView';

export function ProfileScreen({
  initialTab = 'videos',
}: {
  initialTab?: CreatorProfileTab;
}) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const token = useAuthStore((s) => s.token);

  const { data, isLoading } = useProfileQuery();
  const profile = data?.data;
  const creatorId = profile?._id ?? '';
  const { data: products = [] } = useProductsQuery(creatorId);

  const openStudio = useCallback(async () => {
    if (token) {
      await Linking.openURL(`${config.studioUrl}/login/${token}`);
    }
  }, [token]);

  const openSettings = useCallback(async () => {
    if (token) {
      const redirect = encodeURIComponent('/settings');
      await Linking.openURL(`${config.studioUrl}/login/${token}?redirect=${redirect}`);
    }
  }, [token]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      try {
        const res = await deleteVideo(videoId);
        if (res?.success) {
          success('Video deleted successfully');
          await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
        } else {
          error(res?.message ?? 'Failed to delete video');
        }
      } catch (e: unknown) {
        error((e as { message?: string })?.message ?? 'Failed to delete video');
      }
    },
    [error, queryClient, success],
  );

  if (isLoading || !profile) {
    return <Loader />;
  }

  return (
    <CreatorProfileView
      profile={profile}
      products={products}
      ownerId={creatorId}
      initialTab={initialTab}
      isOwner
      onOpenStudio={openStudio}
      onOpenSettings={openSettings}
      onDeleteVideo={handleDeleteVideo}
      storeEmptyText="No products in your store yet."
    />
  );
}
