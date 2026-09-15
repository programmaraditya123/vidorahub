"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import { findProducts, type FindProductsResponse, type ProductSort, type StoreProduct } from "@/src/lib/storeproducts/storeproducts";
import { formatProductPrice } from "@/src/lib/store/store";
import styles from "./StoresPage.module.scss";

type Filters = { query: string; minPrice: string; maxPrice: string; rating: string; sort: ProductSort };
type SearchState = { key: string; data?: FindProductsResponse; error?: string };
const initialFilters: Filters = { query: "", minPrice: "", maxPrice: "", rating: "", sort: "latest" };

function creatorName(product: StoreProduct) {
  return product.creatorId?.name || product.creatorId?.username || "Unknown creator";
}

function ProductDetails({ product, onClose }: { product: StoreProduct; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const images = (product.images ?? []).filter((url) => typeof url === "string" && url.trim());
  const creator = product.creatorId;
  const avatar = creator?.profilePicUrl || creator?.avatar;
  const dateLabel = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return <dialog ref={dialogRef} className="product-dialog" aria-labelledby="product-detail-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}>
    <header className="detail-header"><span>THE PRODUCT EDIT</span><button type="button" className="close-detail" aria-label="Close product details" onClick={onClose} autoFocus><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>
    <div className="detail-scroll">
      <div className="detail-layout">
        <section className="gallery" aria-label="Product images">
          <div className="main-image">
            {images.length ? <img src={images[imageIndex]} alt={`${product.name}, image ${imageIndex + 1}`} /> : <span>No image available</span>}
            {images.length > 1 && <div className="gallery-navigation"><button type="button" aria-label="Previous image" onClick={() => setImageIndex((index) => (index - 1 + images.length) % images.length)}>←</button><span aria-live="polite">{imageIndex + 1} / {images.length}</span><button type="button" aria-label="Next image" onClick={() => setImageIndex((index) => (index + 1) % images.length)}>→</button></div>}
          </div>
          {images.length > 1 && <div className="thumbnails">{images.map((url, index) => <button key={`${url}-${index}`} type="button" aria-label={`Show image ${index + 1}`} aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}><img src={url} alt="" loading="lazy" /></button>)}</div>}
        </section>
        <div className="detail-copy">
          <div className="category-line">{product.category || "Product"}{product.brand && <span> / {product.brand}</span>}</div>
          <h2 id="product-detail-title">{product.name}</h2>
          <div className="detail-rating"><span aria-hidden="true">★</span> {product.rating?.average !== undefined ? `${product.rating.average} / 5` : "Not yet rated"}<span className="review-count">({product.rating?.count ?? 0} reviews)</span></div>
          <p className="detail-price">{formatProductPrice(product.price, product.currency)}<small>{product.currency || "INR"}</small></p>
          <div className="availability">{product.stock && <span>{product.stock}</span>}{product.status && <span>{product.status}</span>}{product.shippingRequired !== undefined && <span>{product.shippingRequired ? "Shipping required" : "No shipping required"}</span>}</div>
          <section className="description"><h3>About this product</h3><p>{product.description || "The creator hasn't added a description yet."}</p></section>
          {!!product.tags?.length && <div className="product-tags" aria-label="Product tags">{product.tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}</div>}
          <div className="detail-creator">{avatar ? <img src={avatar} alt="" /> : <span className="avatar-placeholder" aria-hidden="true">{creatorName(product).charAt(0)}</span>}<div><small>Meet the creator</small><strong>{creatorName(product)}</strong>{creator?.username && <span>@{creator.username}</span>}</div></div>
          {product.analytics && <section className="activity"><h3>Product activity</h3><dl>{Object.entries(product.analytics).map(([label, value]) => value !== undefined && <div key={label}><dt>{label}</dt><dd>{value.toLocaleString()}</dd></div>)}</dl></section>}
          <details className="more-details"><summary>Additional details</summary><dl>
            {product.brand && <div><dt>Brand</dt><dd>{product.brand}</dd></div>}
            <div><dt>Category</dt><dd>{product.category || "Not specified"}</dd></div>
            {product.createdAt && <div><dt>Added</dt><dd><time dateTime={product.createdAt}>{dateLabel(product.createdAt)}</time></dd></div>}
            {product.updatedAt && <div><dt>Last updated</dt><dd><time dateTime={product.updatedAt}>{dateLabel(product.updatedAt)}</time></dd></div>}
            <div><dt>Product ID</dt><dd>{product._id}</dd></div>
            {creator?._id && <div><dt>Creator ID</dt><dd>{creator._id}</dd></div>}
          </dl></details>
        </div>
      </div>
    </div>
    <footer className="detail-footer"><div><small>Explore more from</small><strong>{creatorName(product)}</strong></div>{creator?._id ? <Link className="detail-store" href={`/channel/${encodeURIComponent(creator._id)}?tab=store`}>View store <span aria-hidden="true">↗</span></Link> : <span className="store-unavailable">Store unavailable</span>}</footer>
    <style jsx>{`
      .product-dialog { position: fixed; inset: 0; margin: auto; padding: 0; width: min(940px, calc(100vw - 32px)); max-width: none; max-height: calc(100dvh - 32px); border: 1px solid #e9e2f1; border-radius: 24px; background: #fff; color: #241b30; box-shadow: 0 32px 100px #170b304d; overflow: hidden; }
      .product-dialog[open] { display: flex; flex-direction: column; }
      .product-dialog::backdrop { background: #17102499; backdrop-filter: blur(6px); }
      .detail-header { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; padding: 12px 24px; border-bottom: 1px solid #eee9f4; }
      .detail-header > span { color: #7c3aed; font-size: 10px; font-weight: 750; letter-spacing: 2px; }
      button { font: inherit; cursor: pointer; }
      .close-detail { display: grid; place-items: center; width: 44px; height: 44px; border: none; border-radius: 50%; background: #f6f3fa; color: #675977; }
      .detail-scroll { overflow-y: auto; overscroll-behavior: contain; min-height: 0; }
      .detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 26px; }
      .gallery { min-width: 0; align-self: start; position: sticky; top: 0; }
      .main-image { position: relative; display: grid; place-items: center; aspect-ratio: 1; border-radius: 18px; overflow: hidden; background: #f6f3fa; color: #746b80; }
      .main-image > img { width: 100%; height: 100%; min-height: 0; object-fit: contain; }
      .gallery-navigation { position: absolute; bottom: 12px; display: flex; align-items: center; gap: 16px; padding: 4px; border-radius: 30px; background: #ffffffed; box-shadow: 0 3px 15px #20103012; font-size: 12px; }
      .gallery-navigation button { width: 44px; height: 44px; border: none; background: transparent; border-radius: 50%; color: #6d28d9; font-size: 20px; }
      .thumbnails { display: flex; gap: 10px; overflow-x: auto; padding: 12px 3px 6px; }
      .thumbnails button { flex: 0 0 62px; height: 62px; padding: 3px; border: 2px solid transparent; border-radius: 12px; background: #f6f3fa; }
      .thumbnails button[aria-pressed="true"] { border-color: #7c3aed; }
      .thumbnails img { width: 100%; height: 100%; border-radius: 7px; object-fit: contain; }
      .detail-copy { min-width: 0; overflow-wrap: anywhere; }
      .category-line { color: #7c3aed; font-size: 12px; font-weight: 650; }
      .category-line span { color: #82768e; }
      h2 { margin: 10px 0 12px; font-size: clamp(24px, 3vw, 32px); letter-spacing: -0.8px; line-height: 1.15; }
      .detail-rating { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 12px; }
      .detail-rating > span:first-child { color: #b77916; }
      .review-count { color: #81768b; }
      .detail-price { margin: 22px 0 14px; font-size: 30px; font-weight: 750; letter-spacing: -0.8px; }
      .detail-price small { margin-left: 8px; font-size: 11px; font-weight: 500; color: #81768b; letter-spacing: 0; }
      .availability, .product-tags { display: flex; flex-wrap: wrap; gap: 6px; }
      .availability span, .product-tags span { padding: 6px 10px; border-radius: 7px; background: #f3effa; color: #6d4a8b; font-size: 11px; }
      .description { padding: 22px 0 16px; }
      h3 { margin: 0 0 10px; font-size: 13px; font-weight: 700; }
      .description p { margin: 0; white-space: pre-wrap; color: #746b80; font-size: 14px; line-height: 1.75; }
      .product-tags span { background: #f6f6f8; color: #746b80; }
      .detail-creator { display: flex; align-items: center; gap: 12px; margin: 22px 0; padding: 16px; border: 1px solid #eee9f4; border-radius: 14px; }
      .detail-creator img, .avatar-placeholder { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
      .avatar-placeholder { display: grid; place-items: center; background: #ede9fe; color: #7c3aed; font-size: 20px; }
      .detail-creator small, .detail-creator strong, .detail-creator span:not(.avatar-placeholder) { display: block; }
      .detail-creator small, .detail-creator span { font-size: 11px; color: #81768b; }
      .detail-creator strong { margin: 3px 0; font-size: 13px; }
      .activity dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 20px; }
      .activity dl div { padding: 12px; border-radius: 10px; background: #faf8fd; }
      dt { color: #81768b; font-size: 11px; text-transform: capitalize; }
      dd { margin: 5px 0 0; font-size: 13px; }
      .activity dd { font-weight: 700; font-size: 18px; }
      .more-details { border-top: 1px solid #eee9f4; }
      summary { padding: 16px 0; cursor: pointer; font-size: 13px; font-weight: 650; }
      .more-details dl { margin: 0; }
      .more-details dl div { display: grid; grid-template-columns: 90px 1fr; gap: 12px; padding: 8px 0; }
      .more-details dd { margin: 0; font-size: 12px; }
      .detail-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 26px; border-top: 1px solid #eee9f4; flex-shrink: 0; background: #fff; }
      .detail-footer > div { min-width: 0; }
      .detail-footer small { display: block; color: #81768b; font-size: 11px; }
      .detail-footer strong { display: block; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; margin-top: 4px; }
      .detail-footer :global(.detail-store) { display: flex; align-items: center; justify-content: center; gap: 24px; flex-shrink: 0; padding: 14px 24px; border-radius: 12px; background: #7c3aed; color: white; text-decoration: none; font-size: 14px; font-weight: 650; }
      .store-unavailable { font-size: 12px; color: #81768b; }
      button:focus-visible, summary:focus-visible, .detail-footer :global(a:focus-visible) { outline: 3px solid #a78bfa; outline-offset: 2px; }
      @media (hover: hover) { button:hover { background: #ede9fe; } .detail-footer :global(.detail-store:hover) { background: #6d28d9; } }
      @media (max-width: 600px) { .product-dialog { width: calc(100vw - 20px); max-height: calc(100dvh - 20px); border-radius: 20px; } .detail-header { padding: 8px 16px; } .detail-layout { grid-template-columns: 1fr; padding: 16px; gap: 20px; } .gallery { position: static; } .main-image { aspect-ratio: 1.15; } .detail-footer { padding: 12px 16px; } .detail-footer :global(.detail-store) { padding: 13px 16px; gap: 14px; } }
    `}</style>
  </dialog>;
}

export default function StoresPage() {
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [viewMode, setViewMode] = useState<"products" | "stores">("products");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<SearchState | null>(null);
  const requestKey = JSON.stringify({ ...filters, page, retry });
  const minPrice = filters.minPrice === "" ? undefined : Number(filters.minPrice);
  const maxPrice = filters.maxPrice === "" ? undefined : Number(filters.maxPrice);
  const validationError = [minPrice, maxPrice].some((price) => price !== undefined && (!Number.isFinite(price) || price < 0))
    ? "Prices must be valid nonnegative numbers."
    : minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
      ? "Minimum price must not exceed maximum price."
      : "";

  const updateFilters = (changes: Partial<Filters>) => {
    setFilters((previous) => ({ ...previous, ...changes }));
    setPage(1);
  };

  const draftMin = draft.minPrice === "" ? undefined : Number(draft.minPrice);
  const draftMax = draft.maxPrice === "" ? undefined : Number(draft.maxPrice);
  const draftError = [draftMin, draftMax].some((price) => price !== undefined && (!Number.isFinite(price) || price < 0))
    ? "Enter a valid price of zero or more."
    : draftMin !== undefined && draftMax !== undefined && draftMin > draftMax
      ? "Maximum price must be equal to or higher than minimum price."
      : "";
  const appliedCount = Number(filters.minPrice !== "" || filters.maxPrice !== "") + Number(filters.rating !== "") + Number(filters.sort !== "latest");
  const updateDraft = (changes: Partial<Filters>) => setDraft((previous) => ({ ...previous, ...changes }));
  const closeFilters = () => {
    dialogRef.current?.close();
    setFiltersOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!filtersOpen) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (validationError) return;
    const controller = new AbortController();
    // Debounce typing; cancel obsolete requests and ignore late responses.
    const timer = window.setTimeout(async () => {
      try {
        const data = await findProducts({
          query: filters.query,
          minPrice,
          maxPrice,
          rating: filters.rating ? Number(filters.rating) : undefined,
          sort: filters.sort,
          page,
          limit: 20,
        }, controller.signal);
        if (!controller.signal.aborted) setResult({ key: requestKey, data });
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        const message = error && typeof error === "object" && "message" in error
          ? String(error.message) : "Unable to load products. Please try again.";
        setResult({ key: requestKey, error: message });
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey, validationError, filters.query, filters.rating, filters.sort, minPrice, maxPrice, page]);

  const current = result?.key === requestKey ? result : null;
  const loading = !validationError && !current;
  const data = current?.data;
  const stores = useMemo(() => {
    const grouped = new Map<string, { product: StoreProduct; products: StoreProduct[] }>();
    for (const product of data?.products ?? []) {
      const id = product.creatorId?._id;
      if (!id) continue;
      const store = grouped.get(id);
      if (store) store.products.push(product);
      else grouped.set(id, { product, products: [product] });
    }
    return Array.from(grouped.values());
  }, [data]);
  const activeCount = viewMode === "products" ? data?.products.length ?? 0 : stores.length;

  return (
    <section className={styles.page} aria-busy={loading}>
      <div className={styles.topBar}>
        <div className={styles.brand}>
          <VidorahubIcon.VidorahubIcon width={30} height={30} color="purple" />
          <div><span>VidoraHub Stores</span><small>{loading ? "Finding products..." : `${activeCount} ${viewMode} on this page`}</small></div>
        </div>
        <div className={styles.searchBox}>
          <VidorahubIcon.SearchIcon width={18} height={18} />
          <input ref={searchRef} className="product-search-input" value={filters.query} maxLength={200} aria-label="Search products" onChange={(event) => updateFilters({ query: event.target.value })} placeholder="Search products, brands, categories..." />
          {filters.query && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { updateFilters({ query: "" }); searchRef.current?.focus(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>}
        </div>
        <div className="topbar-actions">
        <div className={styles.viewSwitch} role="group" aria-label="Store view">
          {(["products", "stores"] as const).map((mode) => (
            <button key={mode} type="button" aria-pressed={viewMode === mode} className={viewMode === mode ? styles.activeSwitch : ""} onClick={() => setViewMode(mode)}>
              {mode === "products" ? "Products" : "Stores"}
            </button>
          ))}
        </div>
        <button ref={triggerRef} className="filter-trigger" type="button" aria-label={`Sort and filter products${appliedCount ? `, ${appliedCount} active preferences` : ""}`} aria-haspopup="dialog" aria-expanded={filtersOpen} aria-controls="product-filters" onClick={() => { setDraft(filters); setFiltersOpen(true); }}>
          <svg className="filter-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h9m4 0h3M4 17h3m4 0h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>
          <span className="filter-label">Filters</span>
          {appliedCount > 0 && <span className="filter-badge" aria-hidden="true">{appliedCount}</span>}
        </button>
        </div>
      </div>
      <dialog ref={dialogRef} id="product-filters" className="filter-dialog" aria-labelledby="filter-title" aria-describedby="filter-description" onCancel={(event) => { event.preventDefault(); closeFilters(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeFilters(); } }}>
        <form className="filter-form" onSubmit={(event) => {
          event.preventDefault();
          if (draftError) return;
          updateFilters({ ...draft, query: filters.query });
          setRetry((value) => value + 1);
          closeFilters();
        }}>
          <header className="filter-header">
            <div><h2 id="filter-title">Sort & filters</h2><p id="filter-description">A few details to find just what you want.</p></div>
            <button type="button" className="filter-close" aria-label="Close filters" onClick={closeFilters}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
          </header>
          <div className="filter-body">
            <fieldset><legend>Sort by</legend><div className="sort-options">
              {([{ value: "latest", label: "Newest arrivals", description: "Discover the latest products" }, { value: "price_asc", label: "Price: low to high", description: "Start with the most affordable" }, { value: "price_desc", label: "Price: high to low", description: "Explore premium picks first" }] as const).map((option) => (
                <label key={option.value} className="sort-option"><input type="radio" name="product-sort" value={option.value} checked={draft.sort === option.value} onChange={() => updateDraft({ sort: option.value })} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>
              ))}
            </div></fieldset>
            <fieldset><legend>Price range</legend><p className="field-hint">Leave either field empty for no limit.</p><div className="price-inputs">
              <label>Minimum price<input type="number" min="0" step="any" inputMode="decimal" value={draft.minPrice} onChange={(event) => updateDraft({ minPrice: event.target.value })} placeholder="No minimum" aria-invalid={!!draftError} aria-describedby={draftError ? "price-error" : undefined} /></label>
              <label>Maximum price<input type="number" min="0" step="any" inputMode="decimal" value={draft.maxPrice} onChange={(event) => updateDraft({ maxPrice: event.target.value })} placeholder="No maximum" aria-invalid={!!draftError} aria-describedby={draftError ? "price-error" : undefined} /></label>
            </div>{draftError && <p id="price-error" className="filter-error" role="alert">{draftError}</p>}</fieldset>
            <fieldset><legend>Customer rating</legend><p className="field-hint">Choose a minimum star rating.</p><div className="rating-options">
              {["", "1", "2", "3", "4", "5"].map((rating) => <label key={rating} className="rating-option"><input type="radio" name="product-rating" value={rating} checked={draft.rating === rating} onChange={() => updateDraft({ rating })} /><span>{rating ? <>{rating}<span className="rating-star" aria-hidden="true"> ★</span><span className="sr-only"> stars</span>{rating !== "5" && "+"}</> : "Any"}</span></label>)}
            </div></fieldset>
          </div>
          <footer className="filter-footer">
            <button type="button" className="filter-reset" onClick={() => setDraft({ ...initialFilters, query: filters.query })}>Reset all</button>
            <div className="filter-actions"><button type="button" className="filter-cancel" onClick={closeFilters}>Cancel</button><button type="submit" className="filter-apply" disabled={!!draftError}>Apply</button></div>
          </footer>
        </form>
      </dialog>
      {validationError && <p className={styles.requestStatus} role="alert">{validationError}</p>}
      {loading && <p className={styles.requestStatus} role="status">Loading products...</p>}
      {current?.error && <div className={styles.requestStatus} role="alert"><p>{current.error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></div>}
      {!validationError && data && (viewMode === "products" ? (
        <div className={`${styles.productGrid} marketplace-grid`}>
          {data.products.map((product) => (
            <article className={`${styles.productCard} marketplace-card`} key={product._id}>
              <div className={`${styles.productImage} card-image`}>
                {product.images?.[0] ? <img src={product.images[0]} alt={product.name} loading="lazy" /> : <div className={`${styles.imagePlaceholder} card-placeholder`}>No image available</div>}
                {product.brand && <span>{product.brand}</span>}
              </div>
              <div className={`${styles.productBody} card-body`}>
                <div className={`${styles.productMeta} card-meta`}><span>{product.category}</span><strong>{product.rating?.count ? `${product.rating.average ?? 0} rating` : "Not yet rated"}</strong></div>
                <h2>{product.name}</h2><p>{product.description}</p>
                <div className={`${styles.priceRow} card-price`}><strong>{formatProductPrice(product.price, product.currency)}</strong></div>
                <div className={`${styles.creatorRow} card-creator`}>
                  <div><small>By {creatorName(product)}</small><span>{product.rating?.count ?? 0} reviews</span></div>
                </div>
                <div className="card-actions"><button type="button" aria-label={`Details for ${product.name}`} aria-haspopup="dialog" onClick={() => setSelectedProduct(product)}>Details</button>{product.creatorId?._id ? <Link href={`/channel/${encodeURIComponent(product.creatorId._id)}?tab=store`}>View store</Link> : <button type="button" disabled>View store</button>}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <p className={styles.requestStatus}>Creators with matching products on this page.</p>
          <div className={styles.storeGrid}>
            {stores.map(({ product, products }) => {
              const creator = product.creatorId!;
              const avatar = creator.profilePicUrl || creator.avatar;
              return <article className={styles.storeCard} key={creator._id}>
                <div className={styles.storeCover}>
                  {product.images?.[0] && <img src={product.images[0]} alt="" loading="lazy" />}
                  {avatar && <div className={styles.storeAvatar}><img src={avatar} alt={creatorName(product)} loading="lazy" /></div>}
                </div>
                <div className={styles.storeBody}>
                  <div className={styles.storeTitleRow}><div><h2>{creatorName(product)}</h2>{creator.username && <p>@{creator.username}</p>}</div></div>
                  <div className={styles.storeTags}>{Array.from(new Set(products.map((item) => item.category))).filter(Boolean).map((category) => <span key={category}>{category}</span>)}</div>
                  <div className={styles.storeFooter}>
                    <div className={styles.previewStack}>{products.filter((item) => item.images?.[0]).slice(0, 3).map((item) => <img key={item._id} src={item.images![0]} alt={item.name} loading="lazy" />)}</div>
                    <div className={styles.storeStats}><strong>{products.length} on this page</strong></div>
                    <Link href={`/channel/${encodeURIComponent(creator._id)}?tab=store`}>Open</Link>
                  </div>
                </div>
              </article>;
            })}
          </div>
        </>
      ))}
      {!validationError && data && activeCount === 0 && <div className={styles.emptyState}><h2>No {viewMode} found</h2><p>Try different filters or another page.</p></div>}
      {!validationError && data && <nav className={styles.pagination} aria-label="Product pages">
        <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span>Page {data.page}</span>
        <button type="button" disabled={!data.hasMore || data.nextPage === null || data.nextPage > 10000} onClick={() => { if (data.nextPage !== null) setPage(data.nextPage); }}>Next</button>
      </nav>}
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Discover creator products</span>
          <h1>Products and creator stores in one marketplace.</h1>
          <p>Explore the latest products, compare prices and ratings, and visit the creator behind each item.</p>
        </div>
      </div>
      {selectedProduct && <ProductDetails key={selectedProduct._id} product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      <style jsx>{`
        .marketplace-grid { gap: 10px; align-items: start; }
        .marketplace-card { min-width: 0; border-radius: 12px; }
        .marketplace-card .card-image { aspect-ratio: 1.6; }
        .marketplace-card .card-placeholder { min-height: 0; font-size: 11px; }
        .marketplace-card .card-body { padding: 9px; }
        .marketplace-card .card-meta { gap: 6px; }
        .marketplace-card .card-meta span, .marketplace-card .card-meta strong { font-size: 10px; }
        .marketplace-card h2 { margin: 4px 0 0; font-size: 14px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .marketplace-card p { min-height: 0; margin: 3px 0 0; font-size: 11px; line-height: 1.4; -webkit-line-clamp: 1; }
        .marketplace-card .card-price { margin-top: 5px; }
        .marketplace-card .card-price strong { font-size: 19px; line-height: 1.3; }
        .marketplace-card .card-creator { margin-top: 5px; padding-top: 5px; }
        .marketplace-card .card-creator > div { min-width: 0; }
        .marketplace-card .card-creator small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; }
        .marketplace-card .card-creator span { font-size: 10px; line-height: 1.3; }
        .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 6px; }
        .card-actions button, .card-actions :global(a) { display: flex; align-items: center; justify-content: center; min-width: 0; min-height: 40px; padding: 4px; border: 1px solid #ddd1ed; border-radius: 8px; background: #fff; color: #6d28d9; font: inherit; font-size: 12px; font-weight: 650; text-decoration: none; cursor: pointer; }
        .card-actions :global(a) { background: #7c3aed; border-color: #7c3aed; color: #fff; }
        .card-actions button:disabled { color: #81768b; opacity: 0.55; cursor: default; }
        .card-actions :global(a:focus-visible) { outline: 3px solid #a78bfa; outline-offset: 3px; }
        @media (max-width: 600px) {
          .marketplace-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .marketplace-card .card-body { padding: 7px; }
          .marketplace-card .card-meta { flex-direction: column; gap: 2px; }
          .marketplace-card .card-meta span, .marketplace-card .card-meta strong { font-size: 10px; overflow-wrap: anywhere; }
          .marketplace-card h2 { font-size: 13px; overflow-wrap: anywhere; }
          .marketplace-card p { font-size: 11px; }
          .marketplace-card .card-price strong { font-size: 18px; overflow-wrap: anywhere; }
          .marketplace-card .card-creator { overflow-wrap: anywhere; font-size: 11px; }
          .marketplace-card .card-image > span { max-width: calc(100% - 16px); left: 8px; top: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; }
          .card-actions button, .card-actions :global(a) { font-size: 10px; min-height: 44px; padding: 3px; }
        }
        .product-search-input:focus, .product-search-input:focus-visible { border: none; outline: none; box-shadow: none; }
        .search-clear { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; padding: 0; border: none; border-radius: 50%; background: transparent; color: #7c3aed; cursor: pointer; }
        .search-clear:hover { background: #f3eeff; }
        .topbar-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; min-width: 0; }
        .filter-trigger { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; gap: 8px; min-width: 44px; min-height: 44px; padding: 10px 16px; border: 1px solid #ddd1ed; border-radius: 12px; background: white; color: #6d28d9; font: inherit; font-size: 14px; font-weight: 650; cursor: pointer; }
        .filter-icon { display: none; }
        .filter-badge { display: grid; place-items: center; min-width: 20px; height: 20px; border-radius: 50%; background: #ede9fe; font-size: 11px; }
        .filter-dialog { position: fixed; inset: 0; width: min(540px, calc(100vw - 32px)); max-width: none; max-height: calc(100dvh - 32px); margin: auto; padding: 0; border: 1px solid #ece6f4; border-radius: 24px; background: #fff; color: #20172e; box-shadow: 0 28px 90px #160b3038; overflow: hidden; }
        .filter-dialog::backdrop { background: #17102488; backdrop-filter: blur(5px); }
        .filter-form { display: flex; flex-direction: column; max-height: calc(100dvh - 34px); }
        .filter-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 24px; border-bottom: 1px solid #eee9f4; }
        .filter-header h2 { margin: 0; font-size: 22px; font-weight: 750; letter-spacing: -0.5px; line-height: 1.3; }
        .filter-header p { margin: 6px 0 0; color: #746b80; font-size: 13px; line-height: 1.5; }
        .filter-close { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; border: 0; border-radius: 50%; background: #f5f2f8; color: #64586f; cursor: pointer; }
        .filter-body { overflow-y: auto; overscroll-behavior: contain; min-height: 0; padding: 24px; display: grid; gap: 26px; }
        fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
        legend { padding: 0; margin-bottom: 12px; font-size: 14px; font-weight: 700; }
        .field-hint { margin: -5px 0 12px; color: #746b80; font-size: 12px; line-height: 1.5; }
        .sort-options { display: grid; gap: 8px; }
        .sort-option { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #e7e1ed; border-radius: 12px; cursor: pointer; }
        .sort-option:has(input:checked) { border-color: #8b5cf6; background: #f7f3ff; }
        .sort-option input { width: 18px; height: 18px; margin: 0; accent-color: #7c3aed; flex-shrink: 0; }
        .sort-option strong { display: block; font-size: 13px; font-weight: 650; }
        .sort-option small { display: block; margin-top: 3px; color: #746b80; font-size: 12px; }
        .price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .price-inputs label { display: grid; gap: 8px; color: #64586f; font-size: 12px; }
        .price-inputs input { box-sizing: border-box; width: 100%; min-width: 0; min-height: 46px; padding: 10px 12px; border: 1px solid #ddd5e7; border-radius: 10px; background: #fff; color: #20172e; font: inherit; font-size: 16px; }
        .price-inputs input::placeholder { color: #8c8396; font-size: 13px; }
        .price-inputs input[aria-invalid="true"] { border-color: #c24154; }
        .filter-error { margin: 10px 0 0; color: #b4233b; font-size: 12px; line-height: 1.5; }
        .rating-options { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
        .rating-option { position: relative; cursor: pointer; }
        .rating-option > input, .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
        .rating-option > span { display: flex; align-items: center; justify-content: center; min-height: 44px; border: 1px solid #e7e1ed; border-radius: 10px; font-size: 13px; font-weight: 600; }
        .rating-option input:checked + span { border-color: #8b5cf6; background: #f7f3ff; color: #6d28d9; }
        .rating-star { color: #b77916; margin: 0 2px; }
        .filter-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 24px; border-top: 1px solid #eee9f4; background: #fff; }
        .filter-header, .filter-footer { flex-shrink: 0; }
        .filter-actions { display: flex; gap: 10px; }
        .filter-footer button { min-height: 44px; padding: 10px 18px; border-radius: 10px; font: inherit; font-size: 14px; font-weight: 650; cursor: pointer; }
        .filter-reset { padding: 10px 0 !important; border: 0; background: transparent; color: #6d28d9; text-decoration: underline; text-underline-offset: 4px; }
        .filter-cancel { border: 1px solid #ddd5e7; background: #fff; color: #64586f; }
        .filter-apply { min-width: 110px; border: 1px solid #7c3aed; background: #7c3aed; color: #fff; box-shadow: 0 4px 10px #7c3aed26; }
        .filter-apply:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
        button:focus-visible, input:focus-visible, .rating-option input:focus-visible + span { outline: 3px solid #a78bfa; outline-offset: 3px; }
        @media (hover: hover) { .filter-trigger:hover, .filter-close:hover, .filter-cancel:hover { background: #f5f0ff; } .sort-option:hover, .rating-option:hover > span { border-color: #a78bfa; } .filter-apply:hover:not(:disabled) { background: #6d28d9; } }
        @media (max-width: 600px) {
          .topbar-actions { grid-column: 1 / -1; justify-content: center; width: 100%; gap: 8px; }
          .filter-icon { display: block; }
          .filter-label { display: none; }
          .filter-trigger { padding: 10px; }
          .filter-dialog { border-radius: 20px; }
          .filter-header, .filter-body { padding: 18px; }
          .filter-header h2 { font-size: 20px; }
          .filter-footer { padding: 14px 18px; }
          .filter-footer button { padding: 10px 14px; }
          .filter-apply { min-width: 88px; }
          .rating-options { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </section>
  );
}
