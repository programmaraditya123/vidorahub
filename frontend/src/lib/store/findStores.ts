import { http3 } from "../http3";

export type StoreOwner = {
  _id: string;
  name?: string;
  profilePicUrl?: string;
  bio?: string;
  location?: string;
  tags?: string[];
  subscriber?: number;
  totalviews?: number;
  totalvideos?: number;
};

export type Store = {
  _id: string;
  ownerId: StoreOwner | string | null;
  name: string;
  description?: string;
  category?: string[];
  subCategory?: string[];
  currency?: string;
  websiteurl?: string;
  policies?: { shipping?: string; returns?: string };
  location?: string;
  rating?: number;
  review_count?: number;
  isAvailable?: boolean;
};

export type FindStoresResponse = {
  success: boolean;
  data: Store[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

export async function findStores(page = 1, limit = 10, signal?: AbortSignal) {
  const response = await http3.get<FindStoresResponse>("/api/store/", {
    params: { page, limit },
    signal,
  });
  if (!response.data.success) throw new Error("Unable to load stores. Please try again.");
  return response.data;
}
