"use client";

import { formatDuration } from "@/src/utils/extractFrames";
import styles from "../../../app/profile/Profile.module.scss";
import { setVideoId } from "@/src/utils/videoStorage";
import { encodeFilename } from "@/src/functions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/src/hooks/ui/ToastProvider/ToastProvider";
// import { creatorDeleteVideo } from "@/src/lib/video/videodata";

type VideoStats = {
  views: number;
};

export type UploadVideo = {
  _id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  visibility: "public" | "private";
  stats: VideoStats;
  videoUrl: string;
};

type MasonryGridProps = {
  uploads: UploadVideo[];
};

export default function MasonryGrid2({ uploads }: MasonryGridProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmVideoId, setConfirmVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { success, error  } = useToast();

  const handleNavigate = (video: UploadVideo) => {
    if (!video.videoUrl) return;
    setVideoId(video._id);

    const lastPart = video.videoUrl.split("vidorahub/")[1];
    const encoded = encodeFilename(lastPart);
    router.push(`/video/${encoded}`);
  };



  return (
    <>
      <div className={styles.masonry}>
        {uploads.map((item) => (
          <div
            key={item._id}
            className={`${styles.card} ${styles.masonryShort}`}
            onClick={() => handleNavigate(item)}
          >
            {/* background */}
            <div
              className={styles.cardBg}
              style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
            />

             

            {/* delete menu */}
            {openMenuId === item._id && (
              <div
                className={styles.deleteMenu}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={styles.deleteBtn}
                  onClick={() => {
                    setConfirmVideoId(item._id);
                    setOpenMenuId(null);
                  }}
                >
                  Delete
                </button>
              </div>
            )}

            {/* duration badge */}
            <div className={styles.durationBadge}>
              {formatDuration(item.duration)}
            </div>

            {/* bottom overlay */}
            <div className={styles.cardInfo}>
              <div className={styles.avatar}></div>
              <div className={styles.textWrap}>
                <p className={styles.title}>{item.title}</p>
                <span className={styles.meta}>
                  {item.stats.views} views
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

     
    </>
  );
}
