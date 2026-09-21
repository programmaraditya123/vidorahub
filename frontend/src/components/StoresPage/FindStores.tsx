"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { findStores, type FindStoresResponse, type Store } from "@/src/lib/store/findStores";
import styles from "./StoresPage.module.scss";
import cards from "./StoreCards.module.scss";
import StoreDetails, { StoreIdentity, storeHref } from "./StoreDetails";
import DiscoveryLoader from "./DiscoveryLoader";

export default function FindStores() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: FindStoresResponse;
    error?: string;
  } | null>(null);
  const key = `${page}:${retry}`;
  const current = result?.key === key ? result : null;
  const data = current?.data;

  useEffect(() => {
    const controller = new AbortController();
    findStores(page, 10, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const message = error && typeof error === "object" && "message" in error
        ? String(error.message) : "Unable to load stores. Please try again.";
      setResult({ key, error: message });
    });
    return () => controller.abort();
  }, [page, key]);

  return <section aria-label="Find stores" aria-busy={!current}>
    {!current && <DiscoveryLoader type="stores" />}
    {current?.error && <div className={styles.requestStatus} role="alert">
      <p>{current.error}</p>
      <button type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button>
    </div>}
    {data && <>
      <p className={styles.requestStatus} role="status">{data.pagination.total} stores · {data.data.length} on this page</p>
      {data.data.length ? <div className={styles.storeGrid}>
        {data.data.map((store) => {
          const href = storeHref(store);
          return <article className={cards.card} key={store._id}>
            <StoreIdentity store={store} />
            <p className={cards.description}>{store.description || "Explore this creator's store."}</p>
            <div className={cards.metadata}>
              <span>{store.review_count ? `${store.rating ?? 0} / 5 ? ${store.review_count} reviews` : "Not yet rated"}</span>
              {store.location && <span>{store.location}</span>}
              {store.isAvailable === false && <span>Currently unavailable</span>}
            </div>
            <div className={cards.tags}>{(store.category ?? []).map((category, index) => <span key={`${category}-${index}`}>{category}</span>)}</div>
            <div className={cards.actions}>
              <button type="button" className={cards.secondary} aria-haspopup="dialog" aria-label={`Details for ${store.name}`} onClick={() => setSelectedStore(store)}>Details</button>
              {href ? <Link className={cards.primary} href={href}>Visit store ?</Link> : <button type="button" className={cards.primary} disabled title="Store owner unavailable">Visit store</button>}
            </div>
          </article>;
        })}
      </div> : <div className={styles.emptyState}><h2>No stores found</h2><p>Check back soon for new creator stores.</p></div>}
      {data.pagination.totalPages > 0 && <nav className={styles.pagination} aria-label="Store pages">
        <button type="button" disabled={!data.pagination.hasPrevious} onClick={() => setPage(data.pagination.page - 1)}>Previous</button>
        <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
        <button type="button" disabled={!data.pagination.hasNext} onClick={() => setPage(data.pagination.page + 1)}>Next</button>
      </nav>}
    </>}
    {selectedStore && <StoreDetails store={selectedStore} onClose={() => setSelectedStore(null)} />}
  </section>;
}
