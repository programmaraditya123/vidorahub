"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import styles from "./VideoCard.module.scss";

// import fallbackThumbnail from "../../ui/videocard/abc.png";
import fallbackThumbnail from "../../../images/sample1.png";

import { encodeFilename } from "@/src/functions";

type Video = {
  _id: string;
  title: string;
  description?: string;
  creatorName?: string;
  videoUrl?: string;
  views?: string;
  duration?: string;
  thumbnail?: string;
  isLive?: boolean;
};

export default function VideoCard({ video }: { video: Video }) {
  const router = useRouter();

  const handleNavigate = useCallback(() => {
    if (!video.videoUrl) return;

    const lastPart = video.videoUrl.split("vidorahub/")[1];
    const encoded = encodeFilename(lastPart!);

    router.push(`/video/${encoded}`);
  }, [router, video.videoUrl]);

  const thumb = video.thumbnail || fallbackThumbnail;

  return (
    <div className={styles.card} onClick={handleNavigate}>
      {/* THUMBNAIL */}
      <div className={styles.thumbnailWrapper}>
        <Image
          src={thumb}
          alt={video.title}
          fill
          className={styles.thumbnail}
        />

        {/* LIVE BADGE */}
        {video.isLive && (
          <span className={styles.liveBadge}>LIVE</span>
        )}

        {/* DURATION (if not live) */}
        {!video.isLive && (
          <span className={styles.duration}>
            {video.duration || "12:45"}
          </span>
        )}
      </div>

      {/* INFO GLASS LAYER */}
      <div className={`${styles.info} glass-dark`}>
        <div className={styles.avatar}></div>

        <div className={styles.meta}>
          <p className={styles.title}>{video.title}</p>

          <span className={styles.creator}>
            {video.creatorName || "Creator"}
          </span>

          {!video.isLive && (
            <span className={styles.views}>
              {video.views || "1.2M views"}
            </span>
          )}

          {video.isLive && (
            <span className={styles.liveText}>🔴 {video.views || "Live now"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
