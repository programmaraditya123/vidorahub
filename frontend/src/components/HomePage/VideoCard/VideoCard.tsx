"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./VideoCard.module.scss";
import fallbackThumbnail from "../../../images/sample1.png";
import { setVideoId } from "@/src/utils/videoStorage";
import { getVideoProgress } from "@/src/lib/video/videoprogress";
import { useFloatingVideoPlayer } from "@/src/components/VideoPage/FloatingVideoPlayer/FloatingVideoPlayerProvider";

type Video = {
  _id: string;
  title: string;
  description?: string;
  creatorName?: string;
  videoUrl?: string;
  views?: number | string;
  duration?: string;
  thumbnailUrl?: string;
  isLive?: boolean;
  profilePicUrl ?: string;
};

const isObjectId = (value?: string) => /^[a-f\d]{24}$/i.test(value || "");

const clampProgressPercent = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.min(100, Math.max(0, value));
};

export default function VideoCard({ video }: { video: Video }) {
  const router = useRouter();
  const { isMiniPlayerVisible, setActiveVideo } = useFloatingVideoPlayer();
  const prefetchedRef = useRef(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  
  const targetUrl = useRef<string | null>(null);
  useEffect(() => {
    targetUrl.current = isObjectId(video._id) ? `/video/${video._id}` : null;
  }, [video._id]);

  useEffect(() => {
    if (typeof window === "undefined" || video.isLive || !isObjectId(video._id)) {
      setProgressPercent(null);
      return;
    }

    const profileId = localStorage.getItem("activeProfileId") || "";
    const token = localStorage.getItem("token");

    if (!token || !isObjectId(profileId)) {
      setProgressPercent(null);
      return;
    }

    let cancelled = false;

    const loadProgress = async () => {
      try {
        const response = await getVideoProgress(profileId, video._id);
        if (cancelled || !response.exists || !response.data) {
          if (!cancelled) setProgressPercent(null);
          return;
        }

        const nextPercent = response.data.isCompleted
          ? 100
          : clampProgressPercent(Number(response.data.percent));

        setProgressPercent(nextPercent);
      } catch {
        if (!cancelled) setProgressPercent(null);
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [video._id, video.isLive]);

  
  
  const handleMouseEnter = useCallback(() => {
    if (prefetchedRef.current || !targetUrl.current) return;
    prefetchedRef.current = true;
    router.prefetch(targetUrl.current);
  }, [router]);

  
  const handleTouchStart = useCallback(() => {
    if (prefetchedRef.current || !targetUrl.current) return;
    prefetchedRef.current = true;
    router.prefetch(targetUrl.current);
  }, [router]);

  const handleNavigate = useCallback(() => {
    if (!targetUrl.current) return;

    
    if (video._id) {
      setVideoId(video._id);
      const thumb = video.thumbnailUrl;
      if (thumb) {
        queueMicrotask(() => {
          localStorage.setItem("thubnailUrl", thumb);
          localStorage.setItem("currentVideoId", video._id);
        });
      }
    }

    if (isMiniPlayerVisible && video.videoUrl) {
      setActiveVideo({
        src: video.videoUrl,
        videoId: video._id,
        title: video.title,
        watchPath: targetUrl.current,
      });
      return;
    }

    
    router.push(targetUrl.current);
  }, [
    isMiniPlayerVisible,
    router,
    setActiveVideo,
    video._id,
    video.thumbnailUrl,
    video.title,
    video.videoUrl,
  ]);

  const thumb = video.thumbnailUrl || fallbackThumbnail;

  return (
    <div
      className={styles.card}
      onClick={handleNavigate}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
    >
      
      <div className={styles.thumbnailWrapper}>
        <Image
          src={thumb}
          alt={video.title}
          fill
          priority={false}
          className={styles.thumbnail}
          loading="lazy"
          
          fetchPriority="high"
          unoptimized
        />

        {video.isLive && <span className={styles.liveBadge}>LIVE</span>}

        {!video.isLive && (
          <span className={styles.duration}>{video.duration || "00:00"}</span>
        )}

        {progressPercent !== null && (
          <div className={styles.watchProgress} aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      
      <div className={`${styles.info} glass-dark`}>
        <div className={styles.avatar}>
         {video.profilePicUrl && <Image
            src={video.profilePicUrl}
            alt={video.title}
            priority={false}
            className={styles.thumbnail}
            loading="lazy"
            
            fetchPriority="low"
            style={{ borderRadius: '50%', objectFit: 'cover' }} 
            height={32}
            width={32}
          />}
        </div>

        <div className={styles.meta}>
          <p className={styles.title}>{video.title}</p>

          <span className={styles.creator}>
            {video.creatorName || "Creator"}
          </span>

          {!video.isLive && (
            <span className={styles.views}>{video.views} views</span>
          )}

          {video.isLive && <span className={styles.liveText}>🔴 Live now</span>}
        </div>
      </div>
    </div>
  );
}

