import { http3 } from "../http3";

export type StoreCategory = {
  _id: string;
  name: string;
  slug: string;
  products: { _id: string; images?: string[] }[];
};

export async function getCategoryCards(signal?: AbortSignal): Promise<StoreCategory[]> {
  const { data } = await http3.get<StoreCategory[]>("/api/storehomepage/categorycards", { signal });
  if (!Array.isArray(data)) throw new Error("Unable to load store categories.");
  return data;
}
