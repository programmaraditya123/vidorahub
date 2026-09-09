"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/src/components/HomePage/Header/Header";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import VidoraHubLoader from "@/src/components/ui/VidoraHubLoader/VidoraHubLoader";
import { http } from "@/src/lib/http";
import { setVideoId } from "@/src/utils/videoStorage";
import fallbackThumbnail from "@/src/images/sample1.png";
import styles from "./results.module.scss";

type SearchVideo = {
  _id: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string | null;
  duration?: number | string;
  category?: string;
  createdAt?: string;
  uploader?: {
    name?: string;
    username?: string;
    profileImage?: string;
  };
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  finalScore?: number;
};

type SearchResponse = {
  success: boolean;
  query: string;
  page: number;
  limit: number;
  count: number;
  results: SearchVideo[];
};

const PAGE_SIZE = 20;
const FILTER_CHIPS = [
  "All",
  "Shorts",
  "Unwatched",
  "Watched",
  "Videos",
  "Recently uploaded",
  "Live",
];

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

function isCanceledRequest(error: unknown) {
  if (!error || typeof error !== "object" || !("raw" in error)) return false;

  const rawError = error.raw;

  return (
    rawError !== null &&
    typeof rawError === "object" &&
    "code" in rawError &&
    rawError.code === "ERR_CANCELED"
  );
}

function getImageSrc(value?: string | null) {
  if (!value) return fallbackThumbnail;

  const trimmed = value.trim();
  const markdownUrl = trimmed.match(/^\[[^\]]+\]\((.+)\)$/);
  const src = markdownUrl?.[1] || trimmed;

  if (src.startsWith("/")) return src;
  if (!/^https?:\/\//i.test(src)) return fallbackThumbnail;

  try {
    return encodeURI(src);
  } catch {
    return fallbackThumbnail;
  }
}

function formatDuration(value?: number | string) {
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

function formatDate(value?: string) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInitialQuery(searchParams: URLSearchParams) {
  return (searchParams.get("search_query") || searchParams.get("q") || "").trim();
}

export default function ResultsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => getInitialQuery(searchParams), [searchParams]);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState("All");
  const [videos, setVideos] = useState<SearchVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (query: string, pageNumber = 1) => {
    const normalizedQuery = query.trim();

    if (requestRef.current) {
      requestRef.current.abort();
    }

    if (normalizedQuery.length < 2) {
      setVideos([]);
      setError("");
      setHasMore(false);
      setPage(1);
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setError("");
    setIsLoading(pageNumber === 1);
    setIsLoadingMore(pageNumber > 1);

    try {
      const response = await http.get<SearchResponse>("/api/v1/results", {
        params: {
          q: normalizedQuery,
          page: pageNumber,
          limit: PAGE_SIZE,
        },
        signal: controller.signal,
      });

      const nextVideos = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      setVideos((current) =>
        pageNumber === 1 ? nextVideos : [...current, ...nextVideos]
      );
      setPage(pageNumber);
      setHasMore(nextVideos.length >= response.data.limit);
    } catch (fetchError) {
      if (!isCanceledRequest(fetchError)) {
        setError(getErrorMessage(fetchError, "Unable to load search results."));
        setHasMore(false);
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
      }
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setActiveQuery(initialQuery);
    fetchResults(initialQuery, 1);
  }, [fetchResults, initialQuery]);

  const openVideo = (video: SearchVideo) => {
    if (!video._id) return;

    setVideoId(video._id);

    if (video.thumbnailUrl) {
      localStorage.setItem("thubnailUrl", video.thumbnailUrl);
    }

    router.push(`/video/${video._id}`);
  };

  return (
    <div className={`${styles.page} page-wrapper`}>
      <div className={styles.sidebarSlot}>
        <Sidebar />
      </div>

      <main className={styles.mainContent}>
        <Header />

        <div className={styles.content}>
          <section className={styles.toolbar}>
            <div className={styles.chips} aria-label="Result filters">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  className={`${styles.chipButton} ${
                    activeFilter === chip ? styles.activeChip : ""
                  }`}
                  onClick={() => setActiveFilter(chip)}
                  type="button"
                >
                  {chip}
                </button>
              ))}
            </div>

          <button className={styles.filterButton} type="button">
            <span>Filters</span>
            <span className={`material-symbols-outlined ${styles.filterIcon}`}>tune</span>
          </button>
          </section>

          {activeQuery.length === 1 && (
            <div className={styles.emptyState}>Type at least 2 characters to search.</div>
          )}

          {!activeQuery && (
            <div className={styles.emptyState}>
              Search from the header to discover videos.
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
            </div>
          )}

          {!!activeQuery && (
            <section className={styles.resultsInfo}>
              <div>
                <span>Search results</span>
                <h1>{activeQuery}</h1>
              </div>
              <p>
                {isLoading
                  ? "Searching..."
                  : `${videos.length} result${videos.length === 1 ? "" : "s"}`}
              </p>
            </section>
          )}

          {!!videos.length && (
            <section className={styles.resultsList}>
              {videos.map((video, index) => (
                <button
                  className={styles.resultItem}
                  key={`${video._id}-${index}`}
                  onClick={() => openVideo(video)}
                >
                  <div className={styles.thumb}>
                    <Image
                      src={getImageSrc(video.thumbnailUrl)}
                      alt={video.title || "Search result"}
                      fill
                      sizes="(max-width: 900px) 100vw, 520px"
                      unoptimized
                    />
                    <span>{formatDuration(video.duration)}</span>
                    {index === 0 && (
                      <span className={styles.openBadge}>
                        <span className="material-symbols-outlined">arrow_outward</span>
                      </span>
                    )}
                  </div>

                  <div className={styles.resultDetails}>
                    <div className={styles.resultTitleRow}>
                      <h2>{video.title || "Untitled video"}</h2>
                      <span className="material-symbols-outlined">more_vert</span>
                    </div>
                    <p className={styles.resultStats}>
                      {formatCount(video.stats?.views)} views • {formatDate(video.createdAt)}
                    </p>
                    <div className={styles.creatorLine}>
                      <span className={styles.creatorAvatar}>
                        {(video.uploader?.name || video.uploader?.username || "V")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      <span>{video.uploader?.name || video.uploader?.username || "Creator"}</span>
                    </div>
                    <p className={styles.description}>
                      {video.description || "Watch this video on Vidorahub."}
                    </p>
                    <div className={styles.badges}>
                      <span>{video.category || "Video"}</span>
                      {index === 0 && <span>Top match</span>}
                      {video.stats?.likes ? <span>{formatCount(video.stats.likes)} likes</span> : null}
                    </div>
                  </div>
                </button>
              ))}
            </section>
          )}

          {!!videos.length && (
            <section className={styles.mobileList}>
              {videos.map((video, index) => (
                <button
                  className={styles.mobileItem}
                  key={`mobile-${video._id}-${index}`}
                  onClick={() => openVideo(video)}
                >
                  <div className={styles.mobileThumb}>
                    <Image
                      src={getImageSrc(video.thumbnailUrl)}
                      alt={video.title || "Search result"}
                      fill
                      sizes="42vw"
                      unoptimized
                    />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                  <div>
                    <h3>{video.title || "Untitled video"}</h3>
                    <p>
                      {video.uploader?.name || video.uploader?.username || "Creator"} •{" "}
                      {formatCount(video.stats?.views)} views
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {!isLoading && !error && activeQuery.length > 1 && !videos.length && (
            <div className={styles.emptyState}>No videos found for "{activeQuery}".</div>
          )}

          {isLoading && <VidoraHubLoader />}

          {hasMore && !isLoading && (
            <button
              className={styles.loadMore}
              onClick={() => fetchResults(activeQuery, page + 1)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading..." : "Load more results"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
