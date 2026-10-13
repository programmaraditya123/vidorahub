"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getCategoryProducts, readCategoryQuery, type CategoryProductsResponse } from "@/src/lib/storeproducts/categoryProducts";
import { formatProductPrice, type ApiProduct } from "@/src/lib/store/store";
import styles from "./CategoryProducts.module.scss";

function ProductImage({ src, name, sizes = "(max-width: 600px) 85vw, (max-width: 1100px) 40vw, 25vw" }: { src?: string; name: string; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  let valid = false;
  try { valid = !!src && ["https:", "http:"].includes(new URL(src).protocol); } catch { /* Show the placeholder. */ }
  return <div className={styles.image}>
    {valid && !failed ? <Image src={src!} alt={name} fill sizes={sizes} unoptimized onError={() => setFailed(true)} />
      : <div className={styles.imageFallback}><span aria-hidden="true">◇</span><small>Image unavailable</small></div>}
  </div>;
}

function ProductDetails({ product, category, onClose }: { product: ApiProduct; category: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const images = (product.images ?? []).filter(Boolean);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="category-product-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <header className={styles.dialogHeader}><span className={styles.eyebrow}>PRODUCT DETAILS</span><button type="button" aria-label="Close product details" onClick={onClose} autoFocus>✕</button></header>
    <div className={styles.detailLayout}>
      <div>
        <ProductImage key={images[index] ?? "empty"} src={images[index]} name={product.name} sizes="(max-width: 650px) 90vw, 400px" />
        {images.length > 1 && <div className={styles.gallery}>{images.map((src, i) => <button type="button" key={`${src}-${i}`} aria-label={`View image ${i + 1}`} aria-pressed={index === i} onClick={() => setIndex(i)}>{i + 1}</button>)}</div>}
      </div>
      <div className={styles.detailCopy}>
        <span className={styles.eyebrow}>{category}</span>
        <h2 id="category-product-title">{product.name}</h2>
        <Rating product={product} />
        <p className={styles.detailPrice}>{formatProductPrice(product.price, product.currency)}</p>
        {product.brand?.trim() && <p>Brand: {product.brand}</p>}
        {product.shippingRequired !== undefined && <p className={styles.delivery}>{product.shippingRequired ? "Shipping required" : "No shipping required"}</p>}
        <h3>About this product</h3><p className={styles.description}>{product.description || "The creator hasn't added a description yet."}</p>
        {!!product.tags?.length && <div className={styles.tags}>{product.tags.map((tag, i) => <span key={`${tag}-${i}`}>{tag}</span>)}</div>}
        {product.creatorId && <Link className={styles.primaryButton} href={`/channel/${encodeURIComponent(product.creatorId)}?tab=store`}>Explore creator’s store <span aria-hidden="true">↗</span></Link>}
      </div>
    </div>
  </dialog>;
}

function Rating({ product }: { product: ApiProduct }) {
  return <span className={styles.rating}>{(product.rating?.count ?? 0) > 0
    ? <><span aria-hidden="true">★</span> {(product.rating?.average ?? 0).toFixed(1)} <small>({product.rating?.count})</small></>
    : <small>No reviews yet</small>}</span>;
}

export default function CategoryProducts({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = readCategoryQuery(slug, new URLSearchParams(searchParams.toString()));
  const queryKey = JSON.stringify(query);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: CategoryProductsResponse; error?: string; status?: number }>();
  const [selected, setSelected] = useState<ApiProduct | null>(null);
  const [formError, setFormError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const requestKey = `${queryKey}:${retry}`;
  const invalidRange = query.min_price !== undefined && query.max_price !== undefined && query.min_price > query.max_price;
  const current = result?.key === requestKey ? result : undefined;
  const data = current?.data;
  const loading = !current && !invalidRange;
  const [category, setCategory] = useState<{ slug: string; name: string }>();
  const title = category?.slug === slug ? category.name : slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const activeCount = [query.min_price, query.max_price, query.min_rating].filter((value) => value !== undefined).length;

  useEffect(() => {
    if (invalidRange) return;
    const controller = new AbortController();
    const params = JSON.parse(queryKey) as ReturnType<typeof readCategoryQuery>;
    getCategoryProducts(params, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setResult({ key: requestKey, data });
      setCategory(data.category);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : "Unable to load products. Please try again.";
      const status = error && typeof error === "object" && "status" in error ? Number(error.status) : undefined;
      setResult({ key: requestKey, error: message, status });
    });
    return () => controller.abort();
  }, [queryKey, requestKey, invalidRange]);

  function navigate(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");
    for (const [name, value] of Object.entries(patch)) {
      if (value !== undefined && value !== "") next.set(name, value); else next.delete(name);
    }
    setFormError("");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const min = String(form.get("min_price") ?? "");
    const max = String(form.get("max_price") ?? "");
    if (min && max && Number(min) > Number(max)) { setFormError("Minimum price must not exceed maximum price."); return; }
    navigate({ min_price: min, max_price: max, min_rating: String(form.get("min_rating") ?? "") });
    setFiltersOpen(false);
  }

  function changePage(page: number) {
    navigate({ page: String(page) });
    resultsRef.current?.scrollIntoView({ block: "start" });
    resultsRef.current?.focus({ preventScroll: true });
  }

  return <section className={styles.page}>
    <header className={styles.topBar}><Link href="/stores" className={styles.brand}><span className={styles.brandMark} aria-hidden="true">▷</span> VidoraHub <span>Stores</span></Link><Link href="/stores" className={styles.backLink}>← All categories</Link></header>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/stores">Stores</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
    <div className={styles.hero}>
      <div><span className={styles.eyebrow}>THE CATEGORY EDIT</span><h1>{title}<span>.</span></h1><p>Everyday finds. Independent creators.<br />Discover something you’ll love, all in one place.</p><a className={styles.heroLink} href="#category-results">Explore the collection <span aria-hidden="true">↓</span></a></div>
      <div className={styles.heroArt} aria-hidden="true"><span className={styles.orbit} /><span className={styles.orbitSmall} /><div className={styles.shoppingBag}><svg viewBox="0 0 100 110" fill="none"><path d="M20 34h60l8 66H12l8-66Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="3" /><path d="M35 37V23a15 15 0 0 1 30 0v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="m39 65 9 9 16-20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div><span className={styles.artLabel}>FROM CREATORS, FOR YOU</span></div>
    </div>
    <div className={styles.content}>
      <aside className={styles.filters} aria-label="Product filters">
        <button type="button" className={styles.mobileFilterToggle} aria-expanded={filtersOpen} aria-controls="category-filters" onClick={() => setFiltersOpen(!filtersOpen)}>Filters {activeCount ? `(${activeCount})` : ""}<span aria-hidden="true">{filtersOpen ? "−" : "+"}</span></button>
        <form key={`${query.min_price}:${query.max_price}:${query.min_rating}`} id="category-filters" className={`${styles.filterForm} ${filtersOpen ? styles.filtersOpen : ""}`} onSubmit={applyFilters}>
          <div className={styles.filterHeading}><h2>Refine your finds</h2>{activeCount > 0 && <span>{activeCount}</span>}</div>
          <fieldset><legend>Price range</legend><p className={styles.hint}>In the product’s currency</p><div className={styles.priceInputs}><label>Min<input name="min_price" type="number" min="0" step="any" placeholder="0" defaultValue={query.min_price ?? ""} aria-describedby={formError ? "category-filter-error" : undefined} /></label><span aria-hidden="true">–</span><label>Max<input name="max_price" type="number" min="0" step="any" placeholder="Any" defaultValue={query.max_price ?? ""} aria-describedby={formError ? "category-filter-error" : undefined} /></label></div></fieldset>
          <fieldset><legend>Customer rating</legend>{[["", "All ratings"], ["4", "4 stars & up"], ["3", "3 stars & up"], ["2", "2 stars & up"]].map(([value, label]) => <label className={styles.radio} key={value}><input type="radio" name="min_rating" value={value} defaultChecked={String(query.min_rating ?? "") === value} /><span>{label}</span>{value && <span className={styles.stars} aria-hidden="true">{"★".repeat(Number(value))}</span>}</label>)}{query.min_rating !== undefined && ![2, 3, 4].includes(query.min_rating) && <label className={styles.radio}><input type="radio" name="min_rating" value={query.min_rating} defaultChecked /><span>{query.min_rating} stars & up</span></label>}</fieldset>
          {formError && <p id="category-filter-error" className={styles.errorText} role="alert">{formError}</p>}
          <button className={styles.primaryButton} type="submit">Apply filters <span aria-hidden="true">→</span></button>
          {activeCount > 0 && <button className={styles.resetButton} type="button" onClick={() => navigate({ min_price: undefined, max_price: undefined, min_rating: undefined })}>Reset filters</button>}
          <p className={styles.filterNote}>A world of products.<br />A community of creators.</p>
        </form>
      </aside>
      <div className={styles.results} aria-busy={loading}>
        <form className={styles.search} key={query.search ?? ""} role="search" onSubmit={(event) => { event.preventDefault(); navigate({ search: String(new FormData(event.currentTarget).get("search") ?? "").trim() }); }}><span aria-hidden="true">⌕</span><input name="search" type="search" aria-label={`Search in ${title}`} defaultValue={query.search ?? ""} placeholder={`Search in ${title}…`} /><button type="submit">Search</button></form>
        <div className={styles.resultsBar}><div><h2 id="category-results" tabIndex={-1} ref={resultsRef}>The collection</h2><p role="status" aria-live="polite">{loading ? "Finding your next favorite…" : data ? `${data.pagination.totalProducts.toLocaleString()} ${data.pagination.totalProducts === 1 ? "product" : "products"}${query.search ? ` for “${query.search}”` : " to explore"}` : "Browse category products"}</p></div><label className={styles.sort}>Sort by<select value={query.sort_by} onChange={(event) => navigate({ sort_by: event.target.value })}><option value="newest">Newest arrivals</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option><option value="rating">Top rated</option></select></label></div>
        {(activeCount > 0 || query.search) && <div className={styles.tags} aria-label="Applied filters">{query.search && <button type="button" onClick={() => navigate({ search: undefined })} aria-label="Remove search">Search: {query.search} ×</button>}{query.min_price !== undefined && <button type="button" onClick={() => navigate({ min_price: undefined })} aria-label="Remove minimum price">Min: {query.min_price} ×</button>}{query.max_price !== undefined && <button type="button" onClick={() => navigate({ max_price: undefined })} aria-label="Remove maximum price">Max: {query.max_price} ×</button>}{query.min_rating !== undefined && <button type="button" onClick={() => navigate({ min_rating: undefined })} aria-label="Remove rating filter">{query.min_rating}★ & up ×</button>}</div>}
        {loading && <div className={styles.grid} role="status"><span className={styles.srOnly}>Loading products</span>{Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.skeleton} aria-hidden="true"><div /><span /><span /></div>)}</div>}
        {(current?.error || invalidRange) && <div className={styles.status} role="alert"><span aria-hidden="true">◇</span><h3>{current?.status === 404 ? "Category not found" : "We couldn’t load this collection"}</h3><p>{invalidRange ? "Minimum price must not exceed maximum price. Update or reset your filters." : current?.error}</p>{invalidRange ? <button type="button" className={styles.primaryButton} onClick={() => navigate({ min_price: undefined, max_price: undefined })}>Reset price range</button> : current?.status === 404 ? <Link className={styles.primaryButton} href="/stores">Explore categories</Link> : <button className={styles.primaryButton} type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button>}</div>}
        {data && (data.products.length ? <div className={styles.grid}>{data.products.map((product) => <article className={styles.card} key={product._id}>
          <button className={styles.productImageButton} type="button" aria-label={`View ${product.name}`} aria-haspopup="dialog" onClick={() => setSelected(product)}><ProductImage src={product.images?.[0]} name={product.name} />{product.brand?.trim() && <span className={styles.brandBadge}>{product.brand}</span>}<span className={styles.imageArrow} aria-hidden="true">↗</span></button>
          <div className={styles.cardCopy}><span className={styles.categoryLabel}>{data.category.name}</span><h3><button type="button" aria-haspopup="dialog" onClick={() => setSelected(product)}>{product.name}</button></h3><p>{product.description || "Discover this product from an independent creator."}</p><Rating product={product} /><div className={styles.cardFooter}><strong>{formatProductPrice(product.price, product.currency)}</strong><button type="button" onClick={() => setSelected(product)} aria-haspopup="dialog" aria-label={`Details for ${product.name}`}>Details <span aria-hidden="true">→</span></button></div></div>
        </article>)}</div> : <div className={styles.status}><span aria-hidden="true">⌕</span><h3>{query.page > 1 ? "You’ve reached the end" : activeCount || query.search ? "No matches this time" : "Good things are on their way"}</h3><p>{query.page > 1 ? "Return to the first page to explore this collection." : activeCount || query.search ? "Try a different search or adjust your filters to discover more." : "Creators haven’t listed products in this category yet. Explore another collection while they get ready."}</p>{activeCount || query.search || query.page > 1 ? <button type="button" className={styles.primaryButton} onClick={() => navigate({ search: undefined, min_price: undefined, max_price: undefined, min_rating: undefined })}>Reset collection</button> : <Link className={styles.primaryButton} href="/stores">Explore categories</Link>}</div>)}
        {data && data.pagination.totalPages > 0 && <nav className={styles.pagination} aria-label="Product pages"><button type="button" disabled={!data.pagination.hasPreviousPage} onClick={() => changePage(Math.max(1, data.pagination.page - 1))}>← Previous</button><span>Page {data.pagination.page} of {data.pagination.totalPages}</span><button type="button" disabled={!data.pagination.hasNextPage} onClick={() => changePage(data.pagination.page + 1)}>Next →</button></nav>}
      </div>
    </div>
    <footer className={styles.footer}><span>VidoraHub Stores</span><p>Discover the people behind the products.</p><Link href="/stores">Keep exploring ↗</Link></footer>
    {selected && <ProductDetails key={selected._id} product={selected} category={title} onClose={() => setSelected(null)} />}
  </section>;
}
