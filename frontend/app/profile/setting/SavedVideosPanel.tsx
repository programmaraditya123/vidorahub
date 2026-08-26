"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getAllSavedVideos,
  type SavedVideoItem,
} from "@/src/lib/video/savevideo";
import fallbackThumbnail from "@/src/images/sample1.png";
import { setVideoId } from "@/src/utils/videoStorage";
import styles from "./setting.module.scss";

type SavedVideosPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

type SavedVideosState = {
  videos: SavedVideoItem[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string;
  loaded: boolean;
};

const PAGE_SIZE = 20;

const createInitialState = (): SavedVideosState => ({
  videos: [],
  page: 1,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  error: "",
  loaded: false,
});

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function hasToken() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("token"));
}

function formatSavedAt(value?: string) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDuration(value: SavedVideoItem["duration"]) {
  const duration = Number(value);

  if (!Number.isFinite(duration) || duration <= 0) return "00:00";

  const totalSeconds = Math.floor(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatCount(value?: number) {
  const count = Number(value);

  if (!Number.isFinite(count)) return "0";

  return new Intl.NumberFormat("en", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
}

function getImageSrc(value?: string | null) {
  if (!value) return fallbackThumbnail;

  const trimmedValue = value.trim();
  const markdownUrl = trimmedValue.match(/^\[[^\]]+\]\((.+)\)$/);
  const src = markdownUrl?.[1] || trimmedValue;

  if (src.startsWith("/")) return src;
  if (!/^https?:\/\//i.test(src)) return fallbackThumbnail;

  try {
    return encodeURI(src);
  } catch {
    return fallbackThumbnail;
  }
}

function mergeUniqueVideos(
  currentVideos: SavedVideoItem[],
  nextVideos: SavedVideoItem[]
) {
  const seen = new Set(
    currentVideos.map((video) => video._id || video.savedVideoId || String(video.videoSerialNumber))
  );

  return [
    ...currentVideos,
    ...nextVideos.filter((video) => {
      const key = video._id || video.savedVideoId || String(video.videoSerialNumber);

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    }),
  ];
}

export default function SavedVideosPanel({
  isOpen,
  onClose,
}: SavedVideosPanelProps) {
  const router = useRouter();
  const [state, setState] = useState<SavedVideosState>(createInitialState);
  const [authenticated, setAuthenticated] = useState(false);

  const fetchVideos = useCallback(async (page = 1) => {
    setState((current) => ({
      ...current,
      error: "",
      isLoading: page === 1,
      isLoadingMore: page > 1,
    }));

    try {
      const response = await getAllSavedVideos({ page, limit: PAGE_SIZE });
      const nextVideos = Array.isArray(response.data?.savedVideos)
        ? response.data.savedVideos
        : [];

      setState((current) => ({
        videos: page > 1 ? mergeUniqueVideos(current.videos, nextVideos) : nextVideos,
        page,
        hasMore: Boolean(response.pagination?.hasNextPage),
        isLoading: false,
        isLoadingMore: false,
        error: "",
        loaded: true,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        isLoadingMore: false,
        loaded: true,
        error: getErrorMessage(error, "Unable to load saved videos."),
      }));
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const nextAuthenticated = hasToken();
    setAuthenticated(nextAuthenticated);

    if (nextAuthenticated && !state.loaded) {
      fetchVideos();
    }
  }, [fetchVideos, isOpen, state.loaded]);

  const handleRefresh = () => {
    setState(createInitialState());
    fetchVideos();
  };

  const handleLoadMore = () => {
    if (!state.hasMore || state.isLoading || state.isLoadingMore) return;
    fetchVideos(state.page + 1);
  };

  const getVideoHref = (video: SavedVideoItem) => (video._id ? `/video/${video._id}` : "");

  const handlePrefetch = (video: SavedVideoItem) => {
    const href = getVideoHref(video);
    if (href) router.prefetch(href);
  };

  const handleVideoClick = (video: SavedVideoItem) => {
    const href = getVideoHref(video);

    if (!href) return;

    setVideoId(video._id);

    if (video.thumbnailUrl) {
      localStorage.setItem("thubnailUrl", video.thumbnailUrl);
    }

    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.drawerOverlay} role="dialog" aria-modal="true">
      <aside className={`${styles.reactionDrawer} ${styles.savedDrawer}`}>
        <div className={styles.drawerHeader}>
          <div>
            <span className={styles.eyebrow}>Saved collection</span>
            <h3>Saved videos</h3>
          </div>
          <button
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Close saved videos panel"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={styles.drawerBody}>
          {!authenticated && (
            <div className={styles.emptyState}>
              Sign in again to view your saved videos.
            </div>
          )}

          {authenticated && state.isLoading && (
            <div className={styles.emptyState}>Loading saved videos...</div>
          )}

          {authenticated && state.error && (
            <div className={styles.inlineNotice}>
              <span className="material-symbols-outlined">error</span>
              <p>{state.error}</p>
            </div>
          )}

          {authenticated &&
            !state.isLoading &&
            !state.error &&
            !state.videos.length && (
              <div className={styles.emptyState}>No saved videos found.</div>
            )}

          {!!state.videos.length && (
            <div className={`${styles.reactionList} ${styles.savedVideoList}`}>
              {state.videos.map((video) => {
                const isDisabled = !video._id || video.isDeleted;

                return (
                  <button
                    className={`${styles.reactionVideoItem} ${styles.savedVideoItem}`}
                    key={video.savedVideoId || video._id}
                    onClick={() => handleVideoClick(video)}
                    onMouseEnter={() => handlePrefetch(video)}
                    onTouchStart={() => handlePrefetch(video)}
                    disabled={isDisabled}
                  >
                    <div className={styles.reactionThumbnail}>
                      <Image
                        src={getImageSrc(video.thumbnailUrl)}
                        alt={video.title || "Saved Vidorahub video"}
                        fill
                        sizes="96px"
                        className={styles.reactionThumbnailImage}
                        unoptimized
                      />
                      <span>{formatDuration(video.duration)}</span>
                    </div>

                    <div className={styles.reactionVideoMeta}>
                      <b>{video.title || "Saved video"}</b>
                      <p>{isDisabled ? "Unavailable video" : video.uploader?.name || "Creator"}</p>
                      <div className={styles.reactionVideoStats}>
                        <span>{formatCount(video.stats?.views)} views</span>
                        <span>Saved {formatSavedAt(video.savedAt)}</span>
                      </div>
                    </div>

                    <span className="material-symbols-outlined">bookmark</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.drawerFooter}>
          <button
            className={styles.secondaryBtn}
            onClick={handleRefresh}
            disabled={!authenticated || state.isLoading || state.isLoadingMore}
          >
            Refresh
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleLoadMore}
            disabled={
              !authenticated ||
              state.isLoading ||
              state.isLoadingMore ||
              !state.hasMore
            }
          >
            {state.isLoadingMore
              ? "Loading..."
              : state.hasMore
                ? "Load more"
                : "No more"}
          </button>
        </div>
      </aside>
    </div>
  );
}
