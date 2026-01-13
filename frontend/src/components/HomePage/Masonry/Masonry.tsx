"use client";

import { useEffect, useState } from "react";
import { getVideos } from "@/src/lib/video/uploadvideo";
// import VideoCard from "@/components/VideoCard/VideoCard";

import styles from "./Masonry.module.scss";
import VideoCard from "../VideoCard/VideoCard";

type Video = {
  _id: string;
  title: string;
  description: string;
  creatorName?: string;
  videoUrl?: string;
  views?: string;
  duration?: string;
  thumbnail?: string;
};

export default function Masonry() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const res = await getVideos();
        setVideos(res?.data?.items || []);
      } catch (err) {
        console.error("Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  if (loading) return <div className={styles.loading}>Loading feed...</div>;

  return (
    <div className={`${styles.masonry} masonry-grid`}>
      {videos.map((video) => (
        <div key={video._id} className={`${styles.item} masonry-item`}>
          <VideoCard video={video} />
        </div>
      ))}
    </div>
  );
}
