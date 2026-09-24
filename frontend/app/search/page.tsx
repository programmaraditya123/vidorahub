"use client";

import { useEffect, useRef, useState } from "react";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "./SearchGrid.module.scss";
import VideoCard from "./VideoCard";
import Link from "next/link";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import { getNextVideos } from "@/src/lib/video/videodata";
import { useUserActivity } from "@/src/hooks/ui/Shared/useUserActivity";

type SearchVideo = {
  _id: string;
  title: string;
  thumbnailUrl: string;
  uploader?: { name?: string };
  duration: number;
  videoUrl: string;
};

function SearchResults({ query }: { query: string }) {
  const [videos, setVideos] = useState<SearchVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (page === 1) loaderRef.current?.closest(`.${styles.page}`)?.scrollTo({ top: 0 });

    const fetchVideos = async () => {
      try {
        const res = await getNextVideos({ page, limit: 12, search: query });
        if (cancelled) return;

        setVideos((previous) => {
          const seen = new Set(previous.map((video) => video._id));
          const incoming = (res.data as SearchVideo[]).filter((video) => {
            if (seen.has(video._id)) return false;
            seen.add(video._id);
            return true;
          });
          return [...previous, ...incoming];
        });
        setHasNext(res.pagination.hasNextPage);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchVideos();
    return () => { cancelled = true; };
  }, [page, query, attempt]);

  useEffect(() => {
    const target = loaderRef.current;
    if (!target || loading || error || !hasNext) return;
    let requested = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || requested) return;
      requested = true;
      observer.disconnect();
      setLoading(true);
      setPage((current) => current + 1);
    }, { root: target.closest(`.${styles.page}`), rootMargin: "0px 0px 240px 0px" });

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, error, hasNext]);

  return (
    <>
      {query && <p className={styles.resultsLabel}>Videos for <strong>{query}</strong></p>}

      <div className={styles.grid} aria-busy={loading}>
        {videos.map((video) => (
          <VideoCard
            key={video._id}
            title={video.title}
            image={video.thumbnailUrl}
            creator={video.uploader?.name || "Creator"}
            time={`${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, "0")}`}
            videoUrl={video.videoUrl}
            id={video._id}
          />
        ))}
        {loading && Array.from({ length: videos.length ? 3 : 9 }, (_, index) => (
          <div key={`skeleton-${index}`} className={styles.skeleton} aria-hidden="true" />
        ))}
      </div>

      <div className={styles.status} role="status">
        {loading && <p>Loading videos…</p>}
        {error && (
          <>
            <p>Couldn’t load videos. Please try again.</p>
            <button type="button" onClick={() => {
              setError(false);
              setLoading(true);
              setAttempt((current) => current + 1);
            }}>Try again</button>
          </>
        )}
        {!loading && !error && videos.length === 0 && (
          <><h2>No videos found</h2><p>Try a different keyword or clear your search to explore.</p></>
        )}
        {!loading && !error && !hasNext && videos.length > 0 && <p>You’ve reached the end of these videos.</p>}
      </div>
      <div ref={loaderRef} className={styles.scrollTrigger} aria-hidden="true" />
    </>
  );
}

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useUserActivity();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className={styles.page}>
      <Sidebar />
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo} aria-label="VidoraHub home">
            <VidorahubIcon.VidorahubIcon width={36} height={36} color="purple" />
            <span>VidoraHub</span>
          </Link>
          <div className={styles.searchWrapper} role="search">
            <span className={styles.searchIcon} aria-hidden="true"><VidorahubIcon.SearchIcon /></span>
            <input
              aria-label="Search videos"
              placeholder="Search videos and creators"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <SearchResults key={debouncedSearch} query={debouncedSearch} />
      </main>
    </div>
  );
}
