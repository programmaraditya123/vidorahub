"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTopCarousel, type CarouselStore } from "@/src/lib/store/topCarousel";
import styles from "./StoreCarousel.module.scss";

const INTERVAL = 2000;

function safeUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

const StoreSlide = memo(function StoreSlide({ store }: { store: CarouselStore }) {
  const columns = useMemo(() => {
    const images = [...new Set((store.products ?? []).flatMap((product) => product.images ?? []))]
      .map((url) => safeUrl(url)).filter((url): url is string => !!url);
    const result: string[][] = Array.from({ length: Math.min(4, images.length) }, () => []);
    images.forEach((url, index) => result[index % result.length].push(url));
    return result;
  }, [store]);
  const website = safeUrl(store.websiteurl);

  return <article className={styles.slide} aria-label={store.name}>
    <div className={styles.artwork} aria-hidden="true">
      {columns.length ? columns.map((images, column) => <div className={styles.column} key={column}>
        <div className={styles.imageTrack}>
          {[0, 1].map((copy) => <div className={styles.imageGroup} key={copy}>
            {images.map((url, index) => <div className={styles.imageTile} key={`${url}-${index}`}>
              <Image src={url} alt="" fill sizes="(max-width: 600px) 30vw, 220px" loading="lazy"
                unoptimized={new URL(url).hostname !== "storage.googleapis.com"}
                onError={(event) => { event.currentTarget.style.opacity = "0"; }} />
            </div>)}
          </div>)}
        </div>
      </div>) : <div className={styles.monogram}>{store.name.charAt(0).toUpperCase()}</div>}
    </div>
    <div className={styles.scrim} />
    <div className={styles.copy}>
      <span className={styles.eyebrow}><span /> THE STORE SPOTLIGHT</span>
      {store.location && <p className={styles.location}>{store.location}</p>}
      <h2>{store.name}</h2>
      <p className={styles.description}>{store.description || "Discover something new from this independent store."}</p>
      {!!store.category?.length && <div className={styles.tags} aria-label="Categories">
        {store.category.map((category, index) => <span key={`${category}-${index}`}>{category}</span>)}
      </div>}
      {!!store.subCategory?.length && <p className={styles.subcategories}>{store.subCategory.join(" · ")}</p>}
      <div className={styles.actions}>
        {store.ownerId && <Link prefetch={false} href={`/channel/${encodeURIComponent(store.ownerId)}?tab=store`} className={styles.visit}>Explore store <span aria-hidden="true">↗</span></Link>}
        {website && <a href={website} target="_blank" rel="noopener noreferrer" className={styles.website}>Website <span aria-hidden="true">↗</span></a>}
      </div>
      {!!store.products?.length && <p className={styles.products} title={store.products.map((product) => product.name).join(", ")}>
        In this store: {store.products.map((product) => product.name).join(" · ")}
      </p>}
    </div>
  </article>;
});

export default function StoreCarousel() {
  const ref = useRef<HTMLElement>(null);
  const [result, setResult] = useState<{ stores?: CarouselStore[]; error?: string; attempt: number }>();
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const current = result?.attempt === attempt ? result : undefined;
  const stores = current?.stores;
  const count = stores?.length ?? 0;
  const activeIndex = count ? index % count : 0;
  const playing = count > 1 && !paused && !hovered && !focused && visible && tabVisible && !reducedMotion;

  useEffect(() => {
    const controller = new AbortController();
    getTopCarousel(controller.signal).then((stores) => {
      if (!controller.signal.aborted) setResult({ stores, attempt });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const message = error && typeof error === "object" && "message" in error
        ? String(error.message) : "Unable to load featured stores.";
      setResult({ error: message, attempt });
    });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(media.matches);
    const visibility = () => setTabVisible(!document.hidden);
    motion();
    visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % count), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [playing, count, index]);

  return <section ref={ref} className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Featured stores"
    aria-busy={!current} data-moving={playing} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={(event) => {
      if (count < 2 || (event.target instanceof HTMLElement && event.target.tagName === "A")) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((value) => (value + (event.key === "ArrowRight" ? 1 : count - 1)) % count);
      }
    }}>
    {!current && <div className={`${styles.status} ${styles.loading}`} role="status"><span className={styles.eyebrow}>THE STORE SPOTLIGHT</span><p>Discovering stores for you…</p></div>}
    {current?.error && <div className={styles.status} role="alert"><p>{current.error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div>}
    {stores && !count && <div className={styles.status}><span className={styles.eyebrow}>THE STORE SPOTLIGHT</span><p>New stores are on their way. Check back soon.</p></div>}
    {!!count && stores && <>
      <div aria-live={playing ? "off" : "polite"} aria-atomic="true" className={styles.slideRegion}>
        <StoreSlide key={stores[activeIndex]._id} store={stores[activeIndex]} />
      </div>
      <div className={styles.controls}>
        <span className={styles.counter}>{String(activeIndex + 1).padStart(2, "0")} <span>/ {String(count).padStart(2, "0")}</span></span>
        {count > 1 && <>
          <div className={styles.dots} aria-label="Choose a store">{stores.map((store, dot) => <button type="button" key={store._id} aria-label={`Show ${store.name}`} aria-pressed={dot === activeIndex} onClick={() => setIndex(dot)}><span /></button>)}</div>
          <div className={styles.navigation}>
            <button type="button" aria-label={paused ? "Resume automatic slides" : "Pause automatic slides"} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? "▶" : "Ⅱ"}</button>
            <button type="button" aria-label="Previous store" onClick={() => setIndex((value) => (value - 1 + count) % count)}>←</button>
            <button type="button" aria-label="Next store" onClick={() => setIndex((value) => (value + 1) % count)}>→</button>
          </div>
        </>}
      </div>
    </>}
  </section>;
}
