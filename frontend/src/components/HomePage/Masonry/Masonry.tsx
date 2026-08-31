"use client";

import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getHomeVideoFeed, type HomeFeedVideo } from "@/src/lib/video/uploadvideo";

import styles from "./Masonry.module.scss";
import VideoCard from "../VideoCard/VideoCard";
import { formatDuration } from "@/src/utils/extractFrames";
import VideoCardSkeleton from "../VideoCard/VideoCardSkeleton/VideoCardSkeleton";

const SKELETON_COUNT = 12;

type MasonryProps = {
  selectedCategory: string;
  afterFirstRow?: ReactNode;
};

function getFeedItems(res: Awaited<ReturnType<typeof getHomeVideoFeed>>) {
  if (Array.isArray(res?.videos)) return res.videos;

  const legacyPrimary = Array.isArray(res?.primary) ? res.primary : [];
  const legacySecondary = Array.isArray(res?.secondary) ? res.secondary : [];
  return [...legacyPrimary, ...legacySecondary];
}

function normalizeCursor(cursor: string | number | null | undefined) {
  if (cursor === null || cursor === undefined) return null;

  const normalized = String(cursor).trim();
  return normalized ? cursor : null;
}

function formatFeedDuration(duration: HomeFeedVideo["duration"]) {
  const numericDuration = Number(duration);
  return Number.isFinite(numericDuration) ? formatDuration(numericDuration) : "";
}

export default function Masonry({ selectedCategory, afterFirstRow }: MasonryProps) {
  const [videos, setVideos] = useState<HomeFeedVideo[]>([]);
  const [nextCursor, setNextCursor] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadedInitial, setLoadedInitial] = useState(false);
  const [firstRowCount, setFirstRowCount] = useState(1);

  const requestIdRef = useRef(0);
  const fetchingRef = useRef(false);
  const loadedCursorRef = useRef(new Set<string>());
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const normalizedCategory = selectedCategory.trim().toLowerCase();
  const categoryParam = !normalizedCategory || normalizedCategory === "all" ? "all" : normalizedCategory;

  const loadVideos = useCallback(
    async (cursorToLoad?: string | number | null) => {
      const cursorKey = cursorToLoad === undefined || cursorToLoad === null ? "initial" : String(cursorToLoad);
      if (fetchingRef.current || loadedCursorRef.current.has(cursorKey)) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      fetchingRef.current = true;
      loadedCursorRef.current.add(cursorKey);
      setLoading(true);
      setError(null);

      try {
        const res = await getHomeVideoFeed({
          category: categoryParam,
          cursor: cursorToLoad,
        });

        if (requestIdRef.current !== requestId) return;

        const incomingVideos = getFeedItems(res);
        const safeNextCursor = normalizeCursor(res?.nextCursor);
        const madeCursorProgress =
          cursorToLoad === undefined || cursorToLoad === null || String(safeNextCursor) !== String(cursorToLoad);

        setVideos((currentVideos) => {
          const seenIds = new Set(cursorKey === "initial" ? [] : currentVideos.map((video) => video._id));
          const uniqueVideos = incomingVideos.filter((video) => {
            if (!video?._id || seenIds.has(video._id)) return false;
            seenIds.add(video._id);
            return true;
          });

          return cursorKey === "initial" ? uniqueVideos : [...currentVideos, ...uniqueVideos];
        });

        setNextCursor(safeNextCursor);
        setHasNextPage(Boolean(res?.hasMore) && safeNextCursor !== null && madeCursorProgress);
        if (cursorKey === "initial") {
          setLoadedInitial(true);
        }
      } catch (err) {
        loadedCursorRef.current.delete(cursorKey);
        if (requestIdRef.current !== requestId) return;

        console.error("Error fetching home video feed:", err);
        if (cursorKey === "initial") {
          setVideos([]);
          setNextCursor(null);
          setLoadedInitial(true);
        }
        setHasNextPage(false);
        setError("Unable to load videos right now.");
      } finally {
        if (requestIdRef.current === requestId) {
          fetchingRef.current = false;
          setLoading(false);
        }
      }
    },
    [categoryParam],
  );

  useEffect(() => {
    requestIdRef.current += 1;
    fetchingRef.current = false;
    loadedCursorRef.current.clear();
    setVideos([]);
    setNextCursor(null);
    setHasNextPage(false);
    setLoadedInitial(false);
    setError(null);
    void loadVideos();
  }, [loadVideos]);

  useEffect(() => {
    const updateFirstRowCount = () => {
      const width = window.innerWidth;

      if (width >= 1600) {
        setFirstRowCount(4);
      } else if (width >= 1200) {
        setFirstRowCount(3);
      } else if (width >= 768) {
        setFirstRowCount(2);
      } else {
        setFirstRowCount(1);
      }
    };

    updateFirstRowCount();
    window.addEventListener("resize", updateFirstRowCount);

    return () => window.removeEventListener("resize", updateFirstRowCount);
  }, []);

  const renderedVideos = useMemo(() => {
    const seenIds = new Set<string>();

    return videos
      .filter((video) => {
        if (!video?._id || seenIds.has(video._id)) return false;
        seenIds.add(video._id);
        return true;
      })
      .map((video) => ({
        _id: video._id,
        title: video.title || "Untitled video",
        creatorName: video.uploader?.name,
        thumbnailUrl: video.thumbnailUrl,
        duration: formatFeedDuration(video.duration),
        views: video.stats?.views ?? 0,
        videoUrl: video.videoUrl,
        profilePicUrl: video.uploader?.profilePicUrl,
        createdAt: video.createdAt,
      }));
  }, [videos]);

  const hasVideos = renderedVideos.length > 0;
  const isEmptyCategory = loadedInitial && !loading && !error && !hasVideos;
  const showSkeletons = loading || (!loadedInitial && !error && !hasVideos);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasNextPage || nextCursor === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !fetchingRef.current) {
          void loadVideos(nextCursor);
        }
      },
      {
        rootMargin: "700px 0px",
        threshold: 0,
      },
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [hasNextPage, loadVideos, nextCursor, renderedVideos.length]);

  const triggerIndex = Math.max(renderedVideos.length - 6, 0);
  const afterFirstRowIndex = Math.min(firstRowCount - 1, renderedVideos.length - 1);

  return (
    <>
      {error && <p className={styles.stateMessage}>{error}</p>}
      {isEmptyCategory && <p className={styles.stateMessage}>No videos in this category.</p>}

      <div className={styles.masonry}>
        {renderedVideos.map((video, index) => (
          <Fragment key={video._id}>
            <div
              ref={hasNextPage && index === triggerIndex ? triggerRef : null}
              className={styles.item}
            >
              <VideoCard video={video} />
            </div>

            {afterFirstRow && index === afterFirstRowIndex && (
              <div className={styles.fullRow}>{afterFirstRow}</div>
            )}
          </Fragment>
        ))}

        {showSkeletons &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className={styles.item}
            >
              <VideoCardSkeleton />
            </div>
          ))}
      </div>
    </>
  );
}
