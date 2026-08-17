"use client";

import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { getHomeVideoFeed, type HomeFeedVideo } from "@/src/lib/video/uploadvideo";

import styles from "./Masonry.module.scss";
import VideoCard from "../VideoCard/VideoCard";
import { formatDuration } from "@/src/utils/extractFrames";
import VideoCardSkeleton from "../VideoCard/VideoCardSkeleton/VideoCardSkeleton";

const SKELETON_COUNT = 12;
const PAGE_SIZE = 20;

type MasonryProps = {
  selectedCategory: string;
  afterFirstRow?: ReactNode;
};

type VideoSection = "primary" | "secondary";

type FeedVideo = HomeFeedVideo & {
  section: VideoSection;
};

export default function Masonry({ selectedCategory, afterFirstRow }: MasonryProps) {
  const [primaryVideos, setPrimaryVideos] = useState<HomeFeedVideo[]>([]);
  const [secondaryVideos, setSecondaryVideos] = useState<HomeFeedVideo[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [firstRowCount, setFirstRowCount] = useState(1);

  const requestIdRef = useRef(0);
  const fetchingRef = useRef(false);
  const loadedPagesRef = useRef(new Set<number>());
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const normalizedCategory = selectedCategory.trim().toLowerCase();
  const isAllCategory = !normalizedCategory || normalizedCategory === "all";

  const loadVideos = async (pageToLoad: number) => {
    if (fetchingRef.current || loadedPagesRef.current.has(pageToLoad)) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Previous homepage API:
      // const res = await getVideos({ page: pageToLoad, limit: LIMIT });
      const res = await getHomeVideoFeed({
        category: isAllCategory ? "all" : normalizedCategory,
        page: pageToLoad,
      });

      if (requestIdRef.current !== requestId) return;

      const nextPrimary = Array.isArray(res?.primary) ? res.primary : [];
      const nextSecondary = Array.isArray(res?.secondary) ? res.secondary : [];
      const totalVideos = nextPrimary.length + nextSecondary.length;

      setPrimaryVideos((currentVideos) => {
        const existingIds = new Set(currentVideos.map((video) => video._id));
        const uniqueVideos = nextPrimary.filter((video) => {
          if (!video?._id || existingIds.has(video._id)) return false;
          existingIds.add(video._id);
          return true;
        });

        return pageToLoad === 1 ? uniqueVideos : [...currentVideos, ...uniqueVideos];
      });

      setSecondaryVideos((currentVideos) => {
        const existingIds = new Set([
          ...primaryVideos.map((video) => video._id),
          ...currentVideos.map((video) => video._id),
        ]);
        const uniqueVideos = nextSecondary.filter((video) => {
          if (!video?._id || existingIds.has(video._id)) return false;
          existingIds.add(video._id);
          return true;
        });

        return pageToLoad === 1 ? uniqueVideos : [...currentVideos, ...uniqueVideos];
      });

      setPage(pageToLoad);
      setHasNextPage(Boolean(res?.hasMore) && totalVideos >= PAGE_SIZE);
      loadedPagesRef.current.add(pageToLoad);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      console.error("Error fetching home video feed:", err);
      if (pageToLoad === 1) {
        setPrimaryVideos([]);
        setSecondaryVideos([]);
      }
      setHasNextPage(false);
      setError("Unable to load videos right now.");
    } finally {
      if (requestIdRef.current === requestId) {
        fetchingRef.current = false;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadVideos(1);
  }, []);

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
    const primary = primaryVideos.map((video) => ({
      ...video,
      section: "primary" as const,
    }));
    const secondary = secondaryVideos.map((video) => ({
      ...video,
      section: "secondary" as const,
    }));

    const combined = [...primary, ...secondary];
    const seenIds = new Set<string>();

    return combined
      .filter((video) => {
        if (!video?._id || seenIds.has(video._id)) return false;
        seenIds.add(video._id);
        return true;
      })
      .map((video: FeedVideo) => ({
        _id: video._id,
        title: video.title || "Untitled video",
        creatorName: video.uploader?.name,
        thumbnailUrl: video.thumbnailUrl,
        duration: formatDuration(Number(video.duration)),
        views: video.stats?.views ?? 0,
        videoUrl: video.videoUrl,
        profilePicUrl: video.uploader?.profilePicUrl,
        section: video.section,
      }));
  }, [primaryVideos, secondaryVideos]);

  const secondaryCount = secondaryVideos.length;
  const hasVideos = renderedVideos.length > 0;
  const showCategoryBreak = !isAllCategory && secondaryCount > 0;

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !fetchingRef.current) {
          loadVideos(page + 1);
        }
      },
      {
        rootMargin: "700px 0px",
        threshold: 0,
      },
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [hasNextPage, page, renderedVideos.length]);

  const triggerIndex = Math.max(renderedVideos.length - 6, 0);
  const afterFirstRowIndex = Math.min(firstRowCount - 1, renderedVideos.length - 1);

  return (
    <>
      {error && <p className={styles.stateMessage}>{error}</p>}

      {!loading && !error && !hasVideos && (
        <p className={styles.stateMessage}>No videos available right now.</p>
      )}

      <div className={styles.masonry}>
        {renderedVideos.map((video, index) => (
          <Fragment key={video._id}>
            {showCategoryBreak && video.section === "secondary" && (
              index === 0 || renderedVideos[index - 1]?.section !== "secondary"
            ) && (
              <div className={styles.categoryBreak}>
                <span>No more videos in this category</span>
              </div>
            )}

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

        {loading &&
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
