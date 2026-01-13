"use client";

import styles from "./UpNextSidebar.module.scss";
import Image from "next/image";

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  views: string;
  uploaded: string;
  duration: string;
  thumbnail: string;
}

interface Props {
  autoplay: boolean;
  videos: VideoItem[];
}

export default function UpNextSidebar({ autoplay, videos }: Props) {
  return (
    <div className={`${styles.sidebar} glass-dark`}>
      <h2 className={styles.heading}>Up Next</h2>

      <div className={styles.list}>
        {videos.map((v) => (
          <div className={styles.item} key={v.id}>
            <div className={styles.thumbWrapper}>
              <Image
                src={v.thumbnail}
                alt={v.title}
                fill
                className={styles.thumbnail}
              />

              <span className={styles.duration}>{v.duration}</span>
            </div>

            <div className={styles.meta}>
              <h4 className={styles.title}>{v.title}</h4>

              <div className={styles.sub}>
                <span>{v.channel}</span>
                <span>•</span>
                <span>{v.views}</span>
              </div>

              <p className={styles.upload}>{v.uploaded}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
