"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getHomeVibesFeed,
  type HomeFeedVideo,
} from "@/src/lib/video/uploadvideo";

import styles from "./HomeVibesFeed.module.scss";
import fallbackThumbnail from "../../../images/sample1.png";

const PAGE_SIZE = 20;
const SKELETON_COUNT = 8;
const FETCH_AHEAD_COUNT = 2;

type HomeVibesFeedProps = {
  selectedCategory: string;
};

type CachedVibesFeed = {
  vibes: HomeFeedVideo[];
  page: number;
  hasMore: boolean;
};

const initialCacheEntry: CachedVibesFeed = {
  vibes: [],
  page: 0,
  hasMore: true,
};

export default function HomeVibesFeed({ selectedCategory }: HomeVibesFeedProps) {
  const [vibes, setVibes] = useState<HomeFeedVideo[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<Record<string, CachedVibesFeed>>({});
  const fetchingRef = useRef(false);
  const requestedPagesRef = useRef(new Set<string>());
  const rowRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const normalizedCategory = selectedCategory.trim().toLowerCase() || "all";
  const isAllCategory = normalizedCategory === "all";

  const cacheKey = normalizedCategory;

  const saveCache = useCallback(
    (nextEntry: CachedVibesFeed) => {
      cacheRef.current[cacheKey] = nextEntry;
    },
    [cacheKey],
  );

  const loadVibes = useCallback(
    async (pageToLoad: number) => {
      const requestKey = `${cacheKey}:${pageToLoad}`;
      if (fetchingRef.current || requestedPagesRef.current.has(requestKey)) return;
      if (!hasMore && pageToLoad !== 1) return;

      fetchingRef.current = true;
      requestedPagesRef.current.add(requestKey);
      setLoading(true);
      setError(null);

      try {
        const res = await getHomeVibesFeed({
          category: isAllCategory ? "all" : normalizedCategory,
          page: pageToLoad,
        });

        const primary = Array.isArray(res?.primary) ? res.primary : [];
        const secondary = Array.isArray(res?.secondary) ? res.secondary : [];
        const incoming = [...primary, ...secondary];
        const totalIncoming = incoming.length;
        const nextHasMore = Boolean(res?.hasMore) && totalIncoming >= PAGE_SIZE;

        setVibes((currentVibes) => {
          const seenIds = new Set(currentVibes.map((vibe) => vibe._id));
          const uniqueIncoming = incoming.filter((vibe) => {
            if (!vibe?._id || seenIds.has(vibe._id)) return false;
            seenIds.add(vibe._id);
            return true;
          });
          const nextVibes = pageToLoad === 1 ? uniqueIncoming : [...currentVibes, ...uniqueIncoming];

          saveCache({
            vibes: nextVibes,
            page: pageToLoad,
            hasMore: nextHasMore,
          });

          return nextVibes;
        });

        setPage(pageToLoad);
        setHasMore(nextHasMore);
      } catch (err) {
        console.error("Error fetching home vibes feed:", err);
        requestedPagesRef.current.delete(requestKey);
        setError("Unable to load vibes right now.");
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    [cacheKey, hasMore, isAllCategory, normalizedCategory, saveCache],
  );

  useEffect(() => {
    const cached = cacheRef.current[cacheKey] || initialCacheEntry;

    setVibes(cached.vibes);
    setPage(cached.page);
    setHasMore(cached.hasMore);
    setError(null);

    if (cached.page === 0) {
      loadVibes(1);
    }
  }, [cacheKey, loadVibes]);

  useEffect(() => {
    const row = rowRef.current;
    const trigger = triggerRef.current;
    if (!row || !trigger || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !fetchingRef.current) {
          loadVibes(page + 1);
        }
      },
      {
        root: row,
        rootMargin: "0px 240px 0px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [hasMore, loadVibes, page, vibes.length]);

  const renderedVibes = useMemo(
    () =>
      vibes.filter((vibe) => Boolean(vibe?._id)).map((vibe) => ({
        _id: vibe._id,
        title: vibe.title || "Untitled vibe",
        thumbnailUrl: vibe.thumbnailUrl,
        creatorName: vibe.uploader?.name || "Creator",
        views: vibe.stats?.views ?? 0,
      })),
    [vibes],
  );

  const handleOpenVibe = (vibeId: string) => {
    router.push(`/vibes?v=${vibeId}`);
  };

  if (!loading && !error && renderedVibes.length === 0 && page > 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Vibes feed">
      <div className={styles.header}>
        <h2>Vibes</h2>
      </div>

      {error && renderedVibes.length === 0 && (
        <p className={styles.stateMessage}>{error}</p>
      )}

      <div ref={rowRef} className={styles.row}>
        {renderedVibes.map((vibe, index) => {
          const shouldAttachTrigger =
            hasMore && index === Math.max(renderedVibes.length - FETCH_AHEAD_COUNT, 0);

          return (
            <article
              key={vibe._id}
              ref={shouldAttachTrigger ? triggerRef : null}
              className={styles.card}
              onClick={() => handleOpenVibe(vibe._id)}
            >
              <div className={styles.thumbnail}>
                <Image
                  src={vibe.thumbnailUrl || fallbackThumbnail}
                  alt={vibe.title}
                  fill
                  sizes="(max-width: 520px) 38vw, (max-width: 900px) 24vw, 180px"
                  className={styles.image}
                  loading="lazy"
                  unoptimized
                />
              </div>
              <p className={styles.title}>{vibe.title}</p>
              <p className={styles.meta}>
                {vibe.creatorName} · {vibe.views} views
              </p>
            </article>
          );
        })}

        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div key={`vibe-skeleton-${index}`} className={styles.skeleton} />
          ))}
      </div>
    </section>
  );
}
