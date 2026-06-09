import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import {
  getVideos,
  getNextVideos,
  getVideoMetadata,
  getCreatorProfile,
  getCreatorChannel,
  getVibes,
  getComments,
  getEarnings,
  getAllProducts,
} from '@/services/api/authApi';
import {
  getVideoReactions,
  addLike,
  removeLike,
  addDislike,
  removeDislike,
  followCreator,
  unfollowCreator,
  getFollowReaction,
} from '@/services/api/reactionsApi';
import { postComment } from '@/services/api/authApi';
import type { ApiProduct, Product } from '@/types';
import { formatRelativeTime } from '@/utils';

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

export function mapProductForCard(product: ApiProduct): Product {
  const images = (product.images ?? []).filter(Boolean);
  return {
    id: product._id,
    title: product.name,
    category: product.category,
    description: product.description?.trim() || '',
    price: product.price,
    currency: product.currency ?? 'INR',
    images,
    image: images[0] ?? '',
    tags: product.tags ?? [],
    brand: product.brand,
    status: product.status,
    stock: product.stock?.trim() || 'In Stock',
    shippingRequired: product.shippingRequired,
    analytics: product.analytics,
    rating: product.rating,
    updatedAt: formatRelativeTime(product.updatedAt),
    createdAt: product.createdAt,
    size: product.brand?.trim() || product.category,
  };
}

export function useVideosQuery() {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.VIDEOS],
    queryFn: ({ pageParam = 1 }) => getVideos(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasNextPage) return undefined;
      return pages.length + 1;
    },
  });
}

const SEARCH_EXCLUDE_VIDEO_ID = '698433e6e40ae5469b853114';

export function useSearchVideosQuery(search: string) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.SEARCH, search],
    queryFn: ({ pageParam = 1 }) =>
      getNextVideos({
        videoId: SEARCH_EXCLUDE_VIDEO_ID,
        page: pageParam,
        limit: 10,
        search,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const hasNext = (
        lastPage as { pagination?: { hasNextPage?: boolean } }
      )?.pagination?.hasNextPage;
      if (hasNext) return pages.length + 1;
      const items =
        (lastPage as { data?: unknown[]; videos?: unknown[] })?.data ??
        (lastPage as { videos?: unknown[] })?.videos ??
        [];
      if (hasNext === undefined && items.length) return pages.length + 1;
      return undefined;
    },
  });
}

export function useVideoQuery(videoId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.VIDEO, videoId],
    queryFn: () => getVideoMetadata(videoId),
    enabled: Boolean(videoId),
  });
}

export function useUpNextQuery(videoId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.VIDEO, 'upnext', videoId],
    queryFn: () => getNextVideos({ videoId, limit: 10 }),
  });
}

export function useProfileQuery() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: getCreatorProfile,
  });
}

export function useChannelQuery(channelId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.CHANNEL, channelId],
    queryFn: () => getCreatorChannel(channelId),
    enabled: Boolean(channelId),
  });
}

export function useVibesQuery() {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.VIBES],
    queryFn: ({ pageParam }) => getVibes(5, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCommentsQuery(videoId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.COMMENTS, videoId],
    queryFn: () => getComments(videoId),
    enabled: Boolean(videoId),
  });
}

export function usePostCommentMutation(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postComment(videoId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS, videoId] });
    },
  });
}

export function useEarningsQuery(enabled: boolean) {
  return useQuery({
    queryKey: [QUERY_KEYS.EARNINGS],
    queryFn: getEarnings,
    enabled,
  });
}

export function useProductsQuery(creatorId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, creatorId],
    queryFn: async () => {
      const res = await getAllProducts(creatorId);
      return (res.products ?? []).map(mapProductForCard);
    },
    enabled: Boolean(creatorId),
  });
}

export function useReactionsQuery(
  videoSerialNumber: number,
  userSerialNumber?: number,
) {
  return useQuery({
    queryKey: [QUERY_KEYS.REACTIONS, videoSerialNumber, userSerialNumber],
    queryFn: () => getVideoReactions(videoSerialNumber, userSerialNumber),
    enabled: videoSerialNumber > 0,
  });
}

export function useReactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      action: 'like' | 'unlike' | 'dislike' | 'undislike';
      userSerialNumber: number;
      videoSerialNumber: number;
    }) => {
      const payload = {
        userSerialNumber: params.userSerialNumber,
        videoSerialNumber: params.videoSerialNumber,
      };
      switch (params.action) {
        case 'like':
          return addLike(payload);
        case 'unlike':
          return removeLike(payload);
        case 'dislike':
          return addDislike(payload);
        case 'undislike':
          return removeDislike(payload);
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.REACTIONS, vars.videoSerialNumber],
      });
    },
  });
}

export function useFollowQuery(
  creatorId: string,
  userSerialNumber: number,
  creatorSerialNumber: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [QUERY_KEYS.FOLLOW, creatorId, userSerialNumber],
    queryFn: () => getFollowReaction(creatorId, userSerialNumber, creatorSerialNumber),
    enabled: enabled && Boolean(creatorId),
  });
}

export function useFollowMutation(creatorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      action: 'follow' | 'unfollow';
      userSerialNumber: number;
      creatorSerialNumber: number;
    }) => {
      if (params.action === 'follow') {
        return followCreator(creatorId, params.userSerialNumber, params.creatorSerialNumber);
      }
      return unfollowCreator(creatorId, params.userSerialNumber, params.creatorSerialNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FOLLOW, creatorId] });
    },
  });
}
