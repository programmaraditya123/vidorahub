import { http3 } from "../http3";
import type { ApiProduct } from "../store/store";

export type ProductSort = "latest" | "price_asc" | "price_desc";

export type ProductCreator = {
  _id: string;
  username?: string;
  name?: string;
  avatar?: string;
  profilePicUrl?: string;
};

export type StoreProduct = Omit<ApiProduct, "creatorId"> & {
  creatorId: ProductCreator | null;
};

export type FindProductsParams = {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Inclusive minimum average rating, from 1 to 5. */
  rating?: number;
  sort?: ProductSort;
  page?: number;
  limit?: number;
};

export type FindProductsResponse = {
  platform: string;
  count: number;
  products: StoreProduct[];
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
};

export async function findProducts(
  params: FindProductsParams = {},
  signal?: AbortSignal,
): Promise<FindProductsResponse> {
  const response = await http3.get<FindProductsResponse>("/api/products/find", {
    params: { ...params, query: params.query?.trim() || undefined },
    signal,
  });
  return response.data;
}
