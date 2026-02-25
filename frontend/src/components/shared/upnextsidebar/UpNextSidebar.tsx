"use client";

import { useEffect, useState } from "react";
import styles from "./UpNextSidebar.module.scss";
import Image from "next/image";
import { http } from "@/src/lib/http";
import { getVideoId, setVideoId } from "@/src/utils/videoStorage";
import { useRouter } from "next/navigation";
import fallbackThumbnail from "../../../images/sample1.png";  
import { encodeFilename } from "@/src/functions";

interface VideoItem {
  _id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number;
  createdAt: string;
  stats: {
    views: number;
  };
  uploader: {
    _id: string;
    name?: string;
  };
  videoUrl: string;
}

export default function UpNextSidebar() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNext = async () => {
      const currentVideoId = getVideoId();
      if (!currentVideoId) return;

      const res = await http.get("/api/v1/getNextVideos", {
        params: {
          excludeVideoId: currentVideoId,
          page: 1,
          limit: 10,
        },
      });

      setVideos(res.data.data);
    };

    fetchNext();
  }, []);

  const handleNavigate = (video: VideoItem) => {
    if (!video.videoUrl) return;

    setVideoId(video._id);

    const lastPart = video.videoUrl.split("vidorahub/")[1];
    const encoded = encodeFilename(lastPart+`${video?._id}`);
    router.push(`/video/${encoded}`);
  };

  return (
    <div className={`${styles.sidebar} glass-dark`}>
      <h2 className={styles.heading}>Up Next</h2>

      <div className={styles.list}>
        {videos.map((v) => (
          <div
            className={styles.item}
            key={v._id}
            onClick={() => handleNavigate(v)}
          >
            <div className={styles.thumbWrapper}>
              <Image
                src={v.thumbnailUrl || fallbackThumbnail}
                alt={v.title}
                fill
                className={styles.thumbnail}
              />
              <span className={styles.duration}>
                {Math.floor(v.duration / 60)}:
                {Math.floor(v.duration % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>

            <div className={styles.meta}>
              <h4 className={styles.title}>{v.title}</h4>

              <div className={styles.sub}>
                <span>{v.uploader.name || "Unknown"}</span>
                <span>•</span>
                <span>{v.stats.views.toLocaleString()} views</span>
              </div>

              <p className={styles.upload}>
                {new Date(v.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
