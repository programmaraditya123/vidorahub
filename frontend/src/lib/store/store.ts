import { http } from "../http";

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

export type AllProductsResponse = {
  success: boolean;
  count: number;
  products: ApiProduct[];
};

/** UI shape used by ProductCard and ProductModal (mapped from API). */
export type ProductType = {
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
  /** Shown on card badge (brand or category fallback). */
  size: string;
};

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

export async function getAllProducts(creatorId: string) {
  const res = await http.get<AllProductsResponse>(
    `/api/v1/allProducts/${creatorId}`,
  );
  return res.data;
}

export function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export function getProductImages(
  product: Pick<ProductType, "images" | "image">,
): string[] {
  const fromArray = (product.images ?? []).filter(
    (url) => typeof url === "string" && url.trim().length > 0,
  );
  if (fromArray.length > 0) return fromArray;
  if (product.image?.trim()) return [product.image];
  return [];
}

export function formatProductPrice(
  price: number,
  currency = "INR",
): string {
  const symbol = CURRENCY_SYMBOL[currency.toUpperCase()] ?? `${currency} `;
  const formatted =
    Number.isInteger(price) || price % 1 === 0
      ? String(price)
      : price.toFixed(2);
  return `${symbol}${formatted}`;
}

function resolveStockLabel(product: ApiProduct): string {
  if (product.stock?.trim()) return product.stock;
  if (product.status === "active") return "In Stock";
  if (product.status === "inactive") return "Unavailable";
  return "—";
}

export function mapProductForCard(product: ApiProduct): ProductType {
  const images = (product.images ?? []).filter(Boolean);

  return {
    id: product._id,
    title: product.name,
    category: product.category,
    description: product.description?.trim() || "",
    price: product.price,
    currency: product.currency ?? "INR",
    images,
    image: images[0] ?? "",
    tags: product.tags ?? [],
    brand: product.brand,
    status: product.status,
    stock: resolveStockLabel(product),
    shippingRequired: product.shippingRequired,
    analytics: product.analytics,
    rating: product.rating,
    updatedAt: formatRelativeTime(product.updatedAt),
    createdAt: product.createdAt,
    size: product.brand?.trim() || product.category,
  };
}
