"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Store } from "@/src/lib/store/findStores";
import styles from "./StoreCards.module.scss";

export function storeHref(store: Store) {
  const id = typeof store.ownerId === "string" ? store.ownerId : store.ownerId?._id;
  return id ? `/channel/${encodeURIComponent(id)}?tab=store` : null;
}

export function StoreIdentity({ store }: { store: Store }) {
  const owner = typeof store.ownerId === "object" ? store.ownerId : null;
  return <div className={styles.identity}>
    {owner?.profilePicUrl ? <img src={owner.profilePicUrl} alt="" loading="lazy" /> : <span className={styles.initial} aria-hidden="true">{store.name.charAt(0).toUpperCase()}</span>}
    <div><span className={styles.eyebrow}>CREATOR STORE</span><h2>{store.name}</h2><p>{owner?.name ? `By ${owner.name}` : "Independent creator"}</p></div>
  </div>;
}

export default function StoreDetails({ store, onClose }: { store: Store; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const owner = typeof store.ownerId === "object" ? store.ownerId : null;
  const href = storeHref(store);
  let website: string | undefined;
  try {
    const url = new URL(store.websiteurl || "");
    if (["https:", "http:"].includes(url.protocol)) website = url.href;
  } catch { /* A missing or invalid website is displayed as unavailable. */ }

  useEffect(() => {
    const dialog = ref.current;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (focus?.isConnected) focus.focus();
    };
  }, []);

  return <dialog ref={ref} className={styles.dialog} aria-labelledby="store-details-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}>
    <header className={styles.modalHeader}><h2 id="store-details-title">Store details</h2><button type="button" aria-label="Close store details" onClick={onClose} autoFocus>×</button></header>
    <div className={styles.modalContent}>
      <StoreIdentity store={store} />
      <section><h3>About the store</h3><p className={styles.fullDescription}>{store.description || "No description provided yet."}</p></section>
      <dl className={styles.facts}>
        <div><dt>Location</dt><dd>{store.location || "Not specified"}</dd></div>
        <div><dt>Availability</dt><dd>{store.isAvailable === undefined ? "Not specified" : store.isAvailable ? "Available" : "Currently unavailable"}</dd></div>
        <div><dt>Rating</dt><dd>{store.review_count ? `${store.rating ?? 0} / 5 (${store.review_count} reviews)` : "Not yet rated"}</dd></div>
        <div><dt>Currency</dt><dd>{store.currency || "Not specified"}</dd></div>
        <div><dt>Categories</dt><dd>{store.category?.join(", ") || "Not specified"}</dd></div>
        <div><dt>Subcategories</dt><dd>{store.subCategory?.join(", ") || "Not specified"}</dd></div>
        <div><dt>Website</dt><dd>{website ? <a href={website} target="_blank" rel="noopener noreferrer">{website}</a> : "Not provided"}</dd></div>
      </dl>
      <section><h3>Shipping policy</h3><p className={styles.fullDescription}>{store.policies?.shipping || "No shipping policy provided."}</p></section>
      <section><h3>Returns policy</h3><p className={styles.fullDescription}>{store.policies?.returns || "No returns policy provided."}</p></section>
      {owner && <section><h3>About the creator</h3><p>{owner.name || "Store creator"}{owner.location ? ` · ${owner.location}` : ""}</p>{owner.bio && <p className={styles.fullDescription}>{owner.bio}</p>}
        {!!owner.tags?.length && <div className={styles.tags}>{owner.tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}</div>}
        <dl className={styles.facts}>{([["Subscribers", owner.subscriber], ["Views", owner.totalviews], ["Videos", owner.totalvideos]] as const).map(([label, value]) => typeof value === "number" && <div key={label}><dt>{label}</dt><dd>{value.toLocaleString()}</dd></div>)}</dl>
      </section>}
    </div>
    <footer className={styles.modalFooter}>{href ? <Link className={styles.primary} href={href}>Visit store ↗</Link> : <button className={styles.primary} disabled>Visit store</button>}</footer>
  </dialog>;
}
