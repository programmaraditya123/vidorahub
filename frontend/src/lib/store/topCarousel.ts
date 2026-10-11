import { http3 } from "../http3";

export type CarouselStore = {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  category?: string[];
  subCategory?: string[];
  location?: string;
  websiteurl?: string;
  products?: { name: string; images?: string[] }[];
};

export async function getTopCarousel(signal?: AbortSignal): Promise<CarouselStore[]> {
  const { data } = await http3.get<{ stores: CarouselStore[] }>(
    "/api/storehomepage/topcarousel",
    { signal },
  );
  if (!Array.isArray(data?.stores)) throw new Error("Unable to load featured stores.");
  return data.stores;
}
