"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategoryCards, type StoreCategory } from "@/src/lib/store/categoryCards";
import styles from "./CategoryCards.module.scss";

function categoryImages(category: StoreCategory): string[] {
  return [...new Set(category.products.flatMap((product) => product.images ?? []))]
    .filter((value) => {
      try { return ["https:", "http:"].includes(new URL(value).protocol); }
      catch { return false; }
    }).slice(0, 3);
}

function CategoryCard({ category, index }: { category: StoreCategory; index: number }) {
  const images = categoryImages(category);
  const empty = !category.products.length;

  return <Link className={styles.card} href={`/stores/${encodeURIComponent(category.slug)}`} data-tone={index % 4}>
    <div className={styles.cardHeading}>
      <h3>{category.name}</h3>
      <span className={styles.arrow} aria-hidden="true">↗</span>
    </div>
    <div className={styles.artwork} data-count={images.length} aria-hidden="true">
      <span className={styles.orbit} />
      {images.length ? images.map((url, imageIndex) => <div className={styles.photo} key={url}>
        <Image src={url} alt="" fill sizes="(max-width: 600px) 40vw, 160px" unoptimized
          onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
        <span className={styles.photoNumber}>{String(imageIndex + 1).padStart(2, "0")}</span>
      </div>) : <svg className={styles.bag} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 23h34l4 32H11l4-32Z" /><path d="M23 25V16a9 9 0 0 1 18 0v9" /><path d="M27 38h10m-5-5v10" />
      </svg>}
    </div>
    <div className={styles.cardFooter}>
      <p>{empty ? "No creators have listed products in this category yet." : "Discover the creator edit"}</p>
      <span>{empty ? "Explore category" : "Shop the category"} <span aria-hidden="true">→</span></span>
    </div>
  </Link>;
}

export default function CategoryCards() {
  const [result, setResult] = useState<{ attempt: number; categories?: StoreCategory[]; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const current = result?.attempt === attempt ? result : undefined;

  useEffect(() => {
    const controller = new AbortController();
    getCategoryCards(controller.signal).then((categories) => {
      if (!controller.signal.aborted) setResult({ attempt, categories });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const message = error && typeof error === "object" && "message" in error
        ? String(error.message) : "Unable to load store categories.";
      setResult({ attempt, error: message });
    });
    return () => controller.abort();
  }, [attempt]);

  return <section className={styles.section} aria-labelledby="store-categories-heading" aria-busy={!current}>
    <header className={styles.heading}>
      {/* <div><span className={styles.eyebrow}>FIND YOUR NEXT FAVORITE</span><h2 id="store-categories-heading">A little of everything.</h2></div> */}
      {/* <p>Explore categories. Discover independent creators.</p> */}
    </header>
    {!current && <div className={styles.grid} role="status"><span className={styles.srOnly}>Loading store categories…</span>{[0, 1, 2].map((index) => <div className={styles.skeleton} key={index} aria-hidden="true" />)}</div>}
    {current?.error && <div className={styles.status} role="alert"><p>{current.error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div>}
    {current?.categories && (current.categories.length
      ? <div className={styles.grid}>{current.categories.map((category, index) => <CategoryCard key={category._id} category={category} index={index} />)}</div>
      : <p className={styles.status}>New categories are on their way. Check back soon.</p>)}
  </section>;
}
