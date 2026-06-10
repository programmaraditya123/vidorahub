export type ApiError = {
  status?: number;
  message: string;
  raw?: unknown;
};

export type User = {
  _id?: string | number;
  id?: string | number;
  email: string;
  name: string;
  userSerialNumber: string | number;
};

export type AuthResponse = {
  success: boolean;
  token?: string;
  message?: string;
  user?: User;
};

export type VideoStats = {
  views: number;
  likes?: number;
  dislikes?: number;
};

export type Uploader = {
  _id: string;
  name: string;
  profilePicture?: string;
  profilePicUrl?: string;
  subscriber: number;
  userSerialNumber: number;
};

export type VideoItem = {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  hlsUl?: string;
  duration?: number;
  visibility?: string;
  stats: VideoStats;
  uploader?: Uploader;
  videoSerialNumber?: number;
  createdAt?: string;
  tags?: string[];
  category?: string;
};

export type PaginatedVideosResponse = {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  items: VideoItem[];
};

export type VibeItem = VideoItem & {
  videoSerialNumber: number;
  uploader: Uploader;
};

export type CommentUser = {
  _id: string;
  name: string;
  avatar?: string;
  profilePicUrl?: string;
};

export type Comment = {
  _id: string;
  user: CommentUser;
  content: string;
  createdAt: string;
  optimistic?: boolean;
};

export type Platform = {
  _id?: string;
  platform: string;
  url: string;
  audience: number;
};

export type ProfileData = {
  _id: string;
  name: string;
  subscriber: number;
  creator: boolean;
  totalviews: number;
  totalvideos: number;
  uploads: VideoItem[];
  role: number;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  profilePicUrl?: string;
  platforms?: Platform[];
  userSerialNumber?: number;
};

export type ProductAnalytics = {
  views?: number;
  clicks?: number;
  purchases?: number;
};

export type ProductRating = {
  average?: number;
  count?: number;
};

export type ApiProduct = {
  _id: string;
  creatorId?: string;
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  brand?: string;
  price: number;
  currency?: string;
  images?: string[];
  status?: string;
  stock?: string;
  shippingRequired?: boolean;
  analytics?: ProductAnalytics;
  rating?: ProductRating;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  currency: string;
  images: string[];
  image: string;
  tags: string[];
  brand?: string;
  status?: string;
  stock: string;
  shippingRequired?: boolean;
  analytics?: ProductAnalytics;
  rating?: ProductRating;
  updatedAt: string;
  createdAt?: string;
  size: string;
};

export type ReactionResponse = {
  success: boolean;
  liked: boolean;
  disliked: boolean;
  likes: number;
  dislikes: number;
};

export type FollowResponse = {
  success: boolean;
  following: boolean;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
  nextCursor?: string;
};

export type EarningsData = {
  totals?: {
    views?: number;
    likes?: number;
    dislikes?: number;
    comments?: number;
  };
  earnings?: {
    viewsEarning?: number;
    likesEarning?: number;
    dislikesPenalty?: number;
    commentsEarning?: number;
  };
  totalEarning?: number;
  totalPoints?: number;
};

export type UploadMetadataPayload = {
  title: string;
  description: string;
  tags: string[];
  category?: string;
  visibility?: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl?: string | null;
  contentType: 'video' | 'vibe';
};
