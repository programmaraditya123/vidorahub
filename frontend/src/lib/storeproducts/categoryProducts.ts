import { http3 } from "../http3";
import type { ApiProduct } from "../store/store";

export type CategoryProductSort = "newest" | "price_low" | "price_high" | "rating";
export type CategoryProductQuery = {
  category: string;
  page: number;
  limit: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort_by: CategoryProductSort;
};
export type CategoryProductsResponse = {
  success: boolean;
  category: { _id: string; name: string; slug: string };
  pagination: {
    page: number;
    limit: number;
    totalProducts: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  products: ApiProduct[];
};

export function readCategoryQuery(category: string, params: URLSearchParams): CategoryProductQuery {
  const number = (name: string, max = Number.MAX_SAFE_INTEGER) => {
    const raw = params.get(name);
    if (!raw?.trim()) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 && value <= max ? value : undefined;
  };
  const sort = params.get("sort_by");
  const page = number("page");
  return {
    category,
    page: page && Number.isInteger(page) ? page : 1,
    limit: 12,
    search: params.get("search")?.trim() || undefined,
    min_price: number("min_price"),
    max_price: number("max_price"),
    min_rating: number("min_rating", 5),
    sort_by: sort === "price_low" || sort === "price_high" || sort === "rating" ? sort : "newest",
  };
}

export async function getCategoryProducts(params: CategoryProductQuery, signal?: AbortSignal) {
  const { data } = await http3.get<CategoryProductsResponse>("/api/products/categorywiseproducts", { params, signal });
  if (!data?.success || !data.category || !data.pagination || !Array.isArray(data.products)) {
    throw new Error("Products are temporarily unavailable. Please try again.");
  }
  return data;
}
