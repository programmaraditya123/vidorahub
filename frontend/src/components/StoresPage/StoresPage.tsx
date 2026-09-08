"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "./StoresPage.module.scss";

type Product = {
  id: string;
  title: string;
  creator: string;
  storeId: string;
  storeName: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  videoTitle: string;
  stock: string;
  badge: string;
};

type Store = {
  id: string;
  name: string;
  owner: string;
  description: string;
  cover: string;
  avatar: string;
  rating: number;
  products: number;
  followers: string;
  categories: string[];
  productImages: string[];
};

type ViewMode = "products" | "stores";
type SortMode = "featured" | "priceLow" | "priceHigh" | "rating" | "newest";
type SortOption = {
  value: SortMode;
  label: string;
  icon: string;
};

const products: Product[] = [
  {
    id: "desk-mat",
    title: "Creator Desk Mat",
    creator: "Mira Studio",
    storeId: "mira-studio",
    storeName: "Mira Studio Store",
    category: "Studio Gear",
    price: 1299,
    oldPrice: 1699,
    rating: 4.8,
    reviews: 328,
    image: "https://images.unsplash.com/photo-1616627451515-cbc80eaae70f?auto=format&fit=crop&w=900&q=80",
    videoTitle: "Minimal desk setup build",
    stock: "In stock",
    badge: "Best seller",
  },
  {
    id: "light-kit",
    title: "Pocket RGB Light Kit",
    creator: "FrameForge",
    storeId: "frameforge",
    storeName: "FrameForge Supply",
    category: "Lighting",
    price: 3499,
    oldPrice: 4299,
    rating: 4.9,
    reviews: 512,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
    videoTitle: "Three point lighting for reels",
    stock: "12 left",
    badge: "Creator pick",
  },
  {
    id: "ceramic-mug",
    title: "Handmade Edit Fuel Mug",
    creator: "Aarav Makes",
    storeId: "aarav-makes",
    storeName: "Aarav Makes",
    category: "Lifestyle",
    price: 799,
    rating: 4.6,
    reviews: 186,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
    videoTitle: "Late night pottery process",
    stock: "In stock",
    badge: "New drop",
  },
  {
    id: "preset-pack",
    title: "Cinematic Color Presets",
    creator: "ColorCraft",
    storeId: "colorcraft",
    storeName: "ColorCraft Vault",
    category: "Digital",
    price: 999,
    oldPrice: 1499,
    rating: 4.7,
    reviews: 641,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    videoTitle: "How I grade travel videos",
    stock: "Instant access",
    badge: "Digital",
  },
  {
    id: "backpack",
    title: "Modular Camera Backpack",
    creator: "Nomad Lens",
    storeId: "nomad-lens",
    storeName: "Nomad Lens Shop",
    category: "Travel",
    price: 5999,
    oldPrice: 6999,
    rating: 4.5,
    reviews: 95,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    videoTitle: "Packing kit for monsoon shoots",
    stock: "In stock",
    badge: "Travel kit",
  },
  {
    id: "skin-care",
    title: "Glow Routine Starter Set",
    creator: "Naina Beauty",
    storeId: "naina-beauty",
    storeName: "Naina Beauty Shelf",
    category: "Beauty",
    price: 2199,
    rating: 4.8,
    reviews: 274,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    videoTitle: "Morning routine under 10 minutes",
    stock: "In stock",
    badge: "Trending",
  },
];

const stores: Store[] = [
  {
    id: "mira-studio",
    name: "Mira Studio Store",
    owner: "Mira Studio",
    description: "Desk accessories, creator workbench tools, printable planners and small upgrades from Mira's setup videos.",
    cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80",
    rating: 4.8,
    products: 38,
    followers: "42K",
    categories: ["Studio Gear", "Lifestyle"],
    productImages: [products[0].image, products[3].image, products[2].image],
  },
  {
    id: "frameforge",
    name: "FrameForge Supply",
    owner: "FrameForge",
    description: "Lighting kits, mounts, shooting props and downloadable shot lists used across FrameForge tutorials.",
    cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=80",
    rating: 4.9,
    products: 54,
    followers: "88K",
    categories: ["Lighting", "Studio Gear"],
    productImages: [products[1].image, products[4].image, products[0].image],
  },
  {
    id: "naina-beauty",
    name: "Naina Beauty Shelf",
    owner: "Naina Beauty",
    description: "Skin care sets, beauty organizers, camera-ready vanity picks and creator-approved routine bundles.",
    cover: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=220&q=80",
    rating: 4.8,
    products: 27,
    followers: "65K",
    categories: ["Beauty", "Lifestyle"],
    productImages: [products[5].image, products[2].image, products[3].image],
  },
];

const categories = ["All", ...Array.from(new Set(products.map((item) => item.category)))];
const ratingOptions = [0, 3.5, 4, 4.5];
const sortOptions: SortOption[] = [
  { value: "featured", label: "Featured", icon: "auto_awesome" },
  { value: "priceLow", label: "Price: Low to High", icon: "south" },
  { value: "priceHigh", label: "Price: High to Low", icon: "north" },
  { value: "rating", label: "Highest Rating", icon: "grade" },
  { value: "newest", label: "Newest", icon: "schedule" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function StoresPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("products");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [minRating, setMinRating] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const activeSort = sortOptions.find((option) => option.value === sortMode) ?? sortOptions[0];

  useEffect(() => {
    if (!sortOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) {
        setSortOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [sortOpen]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch = [
          product.title,
          product.creator,
          product.storeName,
          product.category,
          product.videoTitle,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesCategory = category === "All" || product.category === category;
        const matchesRating = product.rating >= minRating;

        return matchesSearch && matchesCategory && matchesRating;
      })
      .sort((a, b) => {
        if (sortMode === "priceLow") return a.price - b.price;
        if (sortMode === "priceHigh") return b.price - a.price;
        if (sortMode === "rating") return b.rating - a.rating;
        if (sortMode === "newest") return b.id.localeCompare(a.id);
        return b.reviews - a.reviews;
      });
  }, [category, minRating, query, sortMode]);

  const filteredStores = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return stores
      .filter((store) => {
        const matchesSearch = [store.name, store.owner, store.description, ...store.categories]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesCategory = category === "All" || store.categories.includes(category);
        const matchesRating = store.rating >= minRating;

        return matchesSearch && matchesCategory && matchesRating;
      })
      .sort((a, b) => {
        if (sortMode === "rating") return b.rating - a.rating;
        if (sortMode === "priceLow") return a.products - b.products;
        if (sortMode === "priceHigh") return b.products - a.products;
        return b.products - a.products;
      });
  }, [category, minRating, query, sortMode]);

  const activeCount = viewMode === "products" ? filteredProducts.length : filteredStores.length;

  return (
    <section className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.brand}>
          <VidorahubIcon.VidorahubIcon width={30} height={30} color="purple" />
          <div>
            <span>VidoraHub Stores</span>
            <small>{activeCount} results from creator shops</small>
          </div>
        </div>

        <label className={styles.searchBox}>
          <VidorahubIcon.SearchIcon width={18} height={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, stores, creators..."
          />
        </label>

        <div className={styles.viewSwitch} role="group" aria-label="Store view">
          <button
            type="button"
            className={viewMode === "products" ? styles.activeSwitch : ""}
            onClick={() => setViewMode("products")}
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            Products
          </button>
          <button
            type="button"
            className={viewMode === "stores" ? styles.activeSwitch : ""}
            onClick={() => setViewMode("stores")}
          >
            <span className="material-symbols-outlined">storefront</span>
            Stores
          </button>
        </div>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Shop from videos</span>
          <h1>Products and creator stores in one marketplace.</h1>
          <p>
            Discover items creators list beside their uploads, compare ratings,
            and jump from a product to the store behind it.
          </p>
        </div>
        <div className={styles.heroPanel}>
          <div>
            <span className="material-symbols-outlined">play_circle</span>
            <strong>Video linked products</strong>
            <small>Every product can be discovered from creator uploads.</small>
          </div>
          <div>
            <span className="material-symbols-outlined">verified</span>
            <strong>Creator storefronts</strong>
            <small>Store cards show product previews, ratings and details.</small>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? styles.activeFilter : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className={styles.sortControls}>
          <div className={styles.sortDropdown} ref={sortRef}>
            <button
              type="button"
              className={styles.sortTrigger}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((isOpen) => !isOpen)}
            >
              <span className="material-symbols-outlined">{activeSort.icon}</span>
              <span className={styles.sortText}>
                <small>Sort</small>
                <strong>{activeSort.label}</strong>
              </span>
              <span className="material-symbols-outlined">expand_more</span>
            </button>

            {sortOpen && (
              <div className={styles.sortMenu} role="listbox" aria-label="Sort results">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={sortMode === option.value}
                    className={sortMode === option.value ? styles.activeSortOption : ""}
                    onClick={() => {
                      setSortMode(option.value);
                      setSortOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.ratingFilter} aria-label="Minimum rating">
            <span className="material-symbols-outlined">grade</span>
            {ratingOptions.map((rating) => (
              <button
                key={rating}
                type="button"
                className={minRating === rating ? styles.activeRating : ""}
                onClick={() => setMinRating(rating)}
              >
                {rating === 0 ? "Any" : `${rating}+`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === "products" ? (
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productImage}>
                <img src={product.image} alt={product.title} />
                <span>{product.badge}</span>
              </div>

              <div className={styles.productBody}>
                <div className={styles.productMeta}>
                  <span>{product.category}</span>
                  <strong>{product.rating} rating</strong>
                </div>
                <h2>{product.title}</h2>
                <p>{product.videoTitle}</p>

                <div className={styles.priceRow}>
                  <strong>{formatPrice(product.price)}</strong>
                  {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}
                </div>

                <div className={styles.creatorRow}>
                  <div>
                    <small>By {product.creator}</small>
                    <span>{product.stock} - {product.reviews} reviews</span>
                  </div>
                  <Link href={`/channel/${product.storeId}?tab=store`}>View</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.storeGrid}>
          {filteredStores.map((store) => (
            <article className={styles.storeCard} key={store.id}>
              <div className={styles.storeCover}>
                <img src={store.cover} alt={store.name} />
                <div className={styles.storeAvatar}>
                  <img src={store.avatar} alt={store.owner} />
                </div>
              </div>

              <div className={styles.storeBody}>
                <div className={styles.storeTitleRow}>
                  <div>
                    <h2>{store.name}</h2>
                    <p>{store.owner}</p>
                  </div>
                  <span>{store.rating} rating</span>
                </div>

                <p className={styles.storeDescription}>{store.description}</p>

                <div className={styles.storeTags}>
                  {store.categories.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>

                <div className={styles.storeFooter}>
                  <div className={styles.previewStack}>
                    {store.productImages.map((image) => (
                      <img key={image} src={image} alt="" />
                    ))}
                  </div>
                  <div className={styles.storeStats}>
                    <strong>{store.products} products</strong>
                    <span>{store.followers} followers</span>
                  </div>
                  <Link href={`/channel/${store.id}?tab=store`}>Open</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeCount === 0 && (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined">manage_search</span>
          <h2>No stores found</h2>
          <p>Try a different search, category, or rating filter.</p>
        </div>
      )}
    </section>
  );
}
