"use client";

import { useEffect, useRef, useState } from "react";
import { getVideos } from "@/src/lib/video/uploadvideo";

import styles from "./Masonry.module.scss";
import VideoCard from "../VideoCard/VideoCard";
import { formatDuration } from "@/src/utils/extractFrames";
import VideoCardSkeleton from "../VideoCard/VideoCardSkeleton/VideoCardSkeleton";

type Video = {
  _id: string;
  title: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: string | number;
  stats?: {
    views?: number;
  };
  uploader?: {
    name?: string;
  };
};

const SKELETON_COUNT = 12;
const LIMIT = 12;

export default function Masonry() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);  
  const loadedPagesRef = useRef(new Set<number>()); 

  const loadVideos = async (pageToLoad: number) => {
    if (fetchingRef.current) return;
    if (loadedPagesRef.current.has(pageToLoad)) return;
    if (!hasNextPage) return;

    fetchingRef.current = true;
    setLoading(true);

    try {
      const res = await getVideos({ page: pageToLoad, limit: LIMIT });

      const newVideos: Video[] = res?.items || [];

      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v._id));
        const filtered = newVideos.filter((v) => !existingIds.has(v._id));
        return [...prev, ...filtered];
      });

      setHasNextPage(res?.hasNextPage ?? false);
      loadedPagesRef.current.add(pageToLoad);
    } catch (err) {
      console.error("Error fetching videos:", err);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos(1);
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !fetchingRef.current) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" }  
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [hasNextPage]);

  useEffect(() => {
    if (page === 1) return;
    loadVideos(page);
  }, [page]);

  return (
    <>
      <div className={`${styles.masonry} masonry-grid`}>
        {videos.map((video) => (
          <div key={video._id} className={`${styles.item} masonry-item`}>
            <VideoCard
              video={{
                _id: video._id,
                title: video.title,
                creatorName: video.uploader?.name,
                thumbnailUrl: video.thumbnailUrl as string,
                duration: formatDuration(Number(video.duration)),
                views: video.stats?.views ?? 0,
                videoUrl: video.videoUrl,
              }}
            />
          </div>
        ))}

        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={`skeleton-${i}`} className={`${styles.item} masonry-item`}>
              <VideoCardSkeleton />
            </div>
          ))}
      </div>

      {hasNextPage && <div ref={loaderRef} style={{ height: 1 }} />}
    </>
  );
}
