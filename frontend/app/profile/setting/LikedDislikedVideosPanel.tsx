"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDislikedVideos,
  getLikedVideos,
  type UserReactionVideo,
} from "@/src/lib/video/likesDislikes";
import fallbackThumbnail from "@/src/images/sample1.png";
import { setVideoId } from "@/src/utils/videoStorage";
import styles from "./setting.module.scss";

type ReactionTab = "liked" | "disliked";

type LikedDislikedVideosPanelProps = {
  isOpen: boolean;
  initialTab: ReactionTab;
  onClose: () => void;
};

type ReactionState = {
  videos: UserReactionVideo[];
  nextPageState: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string;
  loaded: boolean;
};

const createInitialState = (): ReactionState => ({
  videos: [],
  nextPageState: null,
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

function getStoredUserSerialNumber() {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("userSerialNumber");
  const userSerialNumber = Number(stored);

  return Number.isInteger(userSerialNumber) && userSerialNumber >= 0
    ? userSerialNumber
    : null;
}

function formatUpdatedAt(value: string) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDuration(value: UserReactionVideo["duration"]) {
  const duration = Number(value);

  if (!Number.isFinite(duration) || duration <= 0) {
    return "00:00";
  }

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

function getReactionScope(video: UserReactionVideo, fallback: ReactionTab) {
  return video.reaction?.scope || (fallback === "liked" ? "like" : "dislike");
}

function getImageSrc(value?: string) {
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
  currentVideos: UserReactionVideo[],
  nextVideos: UserReactionVideo[]
) {
  const seen = new Set(currentVideos.map((video) => video._id || String(video.videoSerialNumber)));

  return [
    ...currentVideos,
    ...nextVideos.filter((video) => {
      const key = video._id || String(video.videoSerialNumber);

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    }),
  ];
}

export default function LikedDislikedVideosPanel({
  isOpen,
  initialTab,
  onClose,
}: LikedDislikedVideosPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ReactionTab>(initialTab);
  const [userSerialNumber, setUserSerialNumber] = useState<number | null>(null);
  const [likedState, setLikedState] = useState<ReactionState>(createInitialState);
  const [dislikedState, setDislikedState] =
    useState<ReactionState>(createInitialState);

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(initialTab);
    setUserSerialNumber(getStoredUserSerialNumber());
  }, [initialTab, isOpen]);

  const activeState = activeTab === "liked" ? likedState : dislikedState;
  const setActiveState = activeTab === "liked" ? setLikedState : setDislikedState;

  const fetchVideos = useCallback(
    async (tab: ReactionTab, pageState: string | null = null) => {
      if (userSerialNumber === null) return;

      const setState = tab === "liked" ? setLikedState : setDislikedState;

      setState((state) => ({
        ...state,
        error: "",
        isLoading: !pageState,
        isLoadingMore: !!pageState,
      }));

      try {
        const response =
          tab === "liked"
            ? await getLikedVideos({ userSerialNumber, pageState })
            : await getDislikedVideos({ userSerialNumber, pageState });

        const nextVideos = Array.isArray(response.videos) ? response.videos : [];

        setState((state) => ({
          videos: pageState ? mergeUniqueVideos(state.videos, nextVideos) : nextVideos,
          nextPageState: response.nextPageState,
          hasMore: Boolean(response.hasMore && response.nextPageState),
          isLoading: false,
          isLoadingMore: false,
          error: "",
          loaded: true,
        }));
      } catch (error) {
        setState((state) => ({
          ...state,
          isLoading: false,
          isLoadingMore: false,
          loaded: true,
          error: getErrorMessage(error, "Unable to load videos."),
        }));
      }
    },
    [userSerialNumber]
  );

  useEffect(() => {
    if (!isOpen || userSerialNumber === null || activeState.loaded) return;

    fetchVideos(activeTab);
  }, [activeState.loaded, activeTab, fetchVideos, isOpen, userSerialNumber]);

  const title = useMemo(
    () => (activeTab === "liked" ? "Liked videos" : "Disliked videos"),
    [activeTab]
  );

  const handleRefresh = () => {
    setActiveState(createInitialState());
    fetchVideos(activeTab);
  };

  const getVideoHref = (video: UserReactionVideo) =>
    video._id ? `/video/${video._id}` : "";

  const handlePrefetch = (video: UserReactionVideo) => {
    const href = getVideoHref(video);

    if (href) {
      router.prefetch(href);
    }
  };

  const handleVideoClick = (video: UserReactionVideo) => {
    const href = getVideoHref(video);

    if (!href) return;

    setVideoId(video._id);
    localStorage.setItem("currentVideoId", video._id);

    if (video.thumbnailUrl) {
      localStorage.setItem("thubnailUrl", video.thumbnailUrl);
    }

    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.drawerOverlay} role="dialog" aria-modal="true">
      <aside className={styles.reactionDrawer}>
        <div className={styles.drawerHeader}>
          <div>
            <span className={styles.eyebrow}>Feedback history</span>
            <h3>{title}</h3>
          </div>
          <button
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Close reactions panel"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={styles.reactionTabs} role="tablist">
          <button
            className={activeTab === "liked" ? styles.activeReactionTab : ""}
            onClick={() => setActiveTab("liked")}
            role="tab"
            aria-selected={activeTab === "liked"}
          >
            Liked videos
          </button>
          <button
            className={activeTab === "disliked" ? styles.activeReactionTab : ""}
            onClick={() => setActiveTab("disliked")}
            role="tab"
            aria-selected={activeTab === "disliked"}
          >
            Disliked videos
          </button>
        </div>

        <div className={styles.drawerBody}>
          {userSerialNumber === null && (
            <div className={styles.emptyState}>
              Sign in again to view your feedback history.
            </div>
          )}

          {userSerialNumber !== null && activeState.isLoading && (
            <div className={styles.emptyState}>Loading {title.toLowerCase()}...</div>
          )}

          {userSerialNumber !== null && activeState.error && (
            <div className={styles.inlineNotice}>
              <span className="material-symbols-outlined">error</span>
              <p>{activeState.error}</p>
            </div>
          )}

          {userSerialNumber !== null &&
            !activeState.isLoading &&
            !activeState.error &&
            !activeState.videos.length && (
              <div className={styles.emptyState}>No {title.toLowerCase()} found.</div>
            )}

          {!!activeState.videos.length && (
            <div className={styles.reactionList}>
              {activeState.videos.map((video) => {
                const isDisabled = !video._id || video.isDeleted;

                return (
                  <button
                    className={styles.reactionVideoItem}
                    key={`${getReactionScope(video, activeTab)}-${video._id || video.videoSerialNumber}`}
                    onClick={() => handleVideoClick(video)}
                    onMouseEnter={() => handlePrefetch(video)}
                    onTouchStart={() => handlePrefetch(video)}
                    disabled={isDisabled}
                  >
                    <div className={styles.reactionThumbnail}>
                      <Image
                        src={getImageSrc(video.thumbnailUrl)}
                        alt={video.title || "Vidorahub video"}
                        fill
                        sizes="96px"
                        className={styles.reactionThumbnailImage}
                        unoptimized
                      />
                      <span>{formatDuration(video.duration)}</span>
                    </div>

                    <div className={styles.reactionVideoMeta}>
                      <b>{video.title || `Video #${video.videoSerialNumber}`}</b>
                      <p>{isDisabled ? "Unavailable video" : video.uploader?.name || "Creator"}</p>
                      <div className={styles.reactionVideoStats}>
                        <span>{formatCount(video.stats?.views)} views</span>
                        <span>{formatUpdatedAt(video.reaction?.updatedAt || video.createdAt || "")}</span>
                      </div>
                    </div>

                    <span className="material-symbols-outlined">
                      {getReactionScope(video, activeTab) === "like"
                        ? "thumb_up"
                        : "thumb_down"}
                    </span>
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
            disabled={activeState.isLoading || activeState.isLoadingMore}
          >
            Refresh
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => fetchVideos(activeTab, activeState.nextPageState)}
            disabled={
              activeState.isLoading ||
              activeState.isLoadingMore ||
              !activeState.hasMore
            }
          >
            {activeState.isLoadingMore
              ? "Loading..."
              : activeState.hasMore
                ? "Load more"
                : "No more"}
          </button>
        </div>
      </aside>
    </div>
  );
}
