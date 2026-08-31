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

const SKELETON_COUNT = 8;
const FETCH_AHEAD_COUNT = 2;

type HomeVibesFeedProps = {
  selectedCategory: string;
};

type CachedVibesFeed = {
  vibes: HomeFeedVideo[];
  nextCursor: string | number | null;
  hasMore: boolean;
  loadedInitial: boolean;
};

const initialCacheEntry: CachedVibesFeed = {
  vibes: [],
  nextCursor: null,
  hasMore: true,
  loadedInitial: false,
};

function getFeedItems(res: Awaited<ReturnType<typeof getHomeVibesFeed>>) {
  if (Array.isArray(res?.videos)) return res.videos;

  const nestedData = res as { data?: { videos?: HomeFeedVideo[] } };
  if (Array.isArray(nestedData.data?.videos)) return nestedData.data.videos;

  const legacyPrimary = Array.isArray(res?.primary) ? res.primary : [];
  const legacySecondary = Array.isArray(res?.secondary) ? res.secondary : [];
  return [...legacyPrimary, ...legacySecondary];
}

function normalizeCursor(cursor: string | number | null | undefined) {
  if (cursor === null || cursor === undefined) return null;

  const normalized = String(cursor).trim();
  return normalized ? cursor : null;
}

function formatUploadedAgo(createdAt?: string) {
  const createdTime = createdAt ? new Date(createdAt).getTime() : NaN;
  if (!Number.isFinite(createdTime)) return "";

  const diffMs = Math.max(0, Date.now() - createdTime);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < month) return `${Math.floor(diffMs / day)}d ago`;
  if (diffMs < year) return `${Math.floor(diffMs / month)}mo ago`;
  return `${Math.floor(diffMs / year)}y ago`;
}

export default function HomeVibesFeed({ selectedCategory }: HomeVibesFeedProps) {
  const [vibes, setVibes] = useState<HomeFeedVideo[]>([]);
  const [nextCursor, setNextCursor] = useState<string | number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedInitial, setLoadedInitial] = useState(false);

  const cacheRef = useRef<Record<string, CachedVibesFeed>>({});
  const fetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const requestedCursorsRef = useRef(new Set<string>());
  const requestIdRef = useRef(0);
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

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const loadVibes = useCallback(
    async (cursorToLoad?: string | number | null) => {
      const cursorKey = cursorToLoad === undefined || cursorToLoad === null ? "initial" : String(cursorToLoad);
      const requestKey = `${cacheKey}:${cursorKey}`;
      if (fetchingRef.current || requestedCursorsRef.current.has(requestKey)) return;
      if (cursorKey !== "initial" && !hasMoreRef.current) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      fetchingRef.current = true;
      requestedCursorsRef.current.add(requestKey);
      setLoading(true);
      setError(null);

      try {
        const res = await getHomeVibesFeed({
          category: isAllCategory ? "all" : normalizedCategory,
          cursor: cursorToLoad,
        });

        if (requestIdRef.current !== requestId) return;

        const incoming = getFeedItems(res);
        const safeNextCursor = normalizeCursor(res?.nextCursor);
        const madeCursorProgress =
          cursorToLoad === undefined || cursorToLoad === null || String(safeNextCursor) !== String(cursorToLoad);
        const nextHasMore = Boolean(res?.hasMore) && safeNextCursor !== null && madeCursorProgress;

        setVibes((currentVibes) => {
          const seenIds = new Set(cursorKey === "initial" ? [] : currentVibes.map((vibe) => vibe._id));
          const uniqueIncoming = incoming.filter((vibe) => {
            if (!vibe?._id || seenIds.has(vibe._id)) return false;
            seenIds.add(vibe._id);
            return true;
          });
          const nextVibes = cursorKey === "initial" ? uniqueIncoming : [...currentVibes, ...uniqueIncoming];

          saveCache({
            vibes: nextVibes,
            nextCursor: safeNextCursor,
            hasMore: nextHasMore,
            loadedInitial: true,
          });

          return nextVibes;
        });

        setNextCursor(safeNextCursor);
        setHasMore(nextHasMore);
        setLoadedInitial(true);
      } catch (err) {
        requestedCursorsRef.current.delete(requestKey);
        if (requestIdRef.current !== requestId) return;

        console.error("Error fetching home vibes feed:", err);
        if (cursorKey === "initial") {
          setVibes([]);
          setNextCursor(null);
          setLoadedInitial(true);
        }
        setHasMore(false);
        setError("Unable to load vibes right now.");
      } finally {
        if (requestIdRef.current === requestId) {
          fetchingRef.current = false;
          setLoading(false);
        }
      }
    },
    [cacheKey, isAllCategory, normalizedCategory, saveCache],
  );

  useEffect(() => {
    const cached = cacheRef.current[cacheKey] || initialCacheEntry;

    requestIdRef.current += 1;
    fetchingRef.current = false;
    requestedCursorsRef.current.clear();
    setVibes(cached.vibes);
    setNextCursor(cached.nextCursor);
    setHasMore(cached.hasMore);
    setLoadedInitial(cached.loadedInitial);
    setError(null);

    if (!cached.loadedInitial) {
      void loadVibes();
    }
  }, [cacheKey, loadVibes]);

  useEffect(() => {
    const row = rowRef.current;
    const trigger = triggerRef.current;
    if (!row || !trigger || !hasMore || nextCursor === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !fetchingRef.current) {
          void loadVibes(nextCursor);
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
  }, [hasMore, loadVibes, nextCursor, vibes.length]);

  const renderedVibes = useMemo(
    () =>
      vibes.filter((vibe) => Boolean(vibe?._id)).map((vibe) => ({
        _id: vibe._id,
        title: vibe.title || "Untitled vibe",
        thumbnailUrl: vibe.thumbnailUrl,
        creatorName: vibe.uploader?.name || "Creator",
        views: vibe.stats?.views ?? 0,
        createdAt: vibe.createdAt,
      })),
    [vibes],
  );

  const handleOpenVibe = (vibeId: string) => {
    router.push(`/vibes?v=${vibeId}`);
  };

  const isEmptyCategory = loadedInitial && !loading && !error && renderedVibes.length === 0;

  return (
    <section className={styles.section} aria-label="Vibes feed">
      <div className={styles.header}>
        <h2>Vibes</h2>
      </div>

      {error && renderedVibes.length === 0 && (
        <p className={styles.stateMessage}>{error}</p>
      )}

      {isEmptyCategory && (
        <p className={styles.stateMessage}>No vibes in this category.</p>
      )}

      <div ref={rowRef} className={styles.row}>
        {renderedVibes.map((vibe, index) => {
          const shouldAttachTrigger =
            hasMore && index === Math.max(renderedVibes.length - FETCH_AHEAD_COUNT, 0);
          const uploadedAgo = formatUploadedAgo(vibe.createdAt);

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
                {vibe.creatorName} | {vibe.views} views{uploadedAgo ? ` | ${uploadedAgo}` : ""}
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
