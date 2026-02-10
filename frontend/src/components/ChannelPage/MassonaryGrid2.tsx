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

//   const handleDelete = async () => {
//     if (!confirmVideoId) return;

//     try {
//       setLoading(true);
//       const res = await creatorDeleteVideo(confirmVideoId);

//       if (res.data?.success) {
//         success("Video deleted successfully");
//         window.location.reload(); // or refetch uploads
//       } else {
//         error(res.data?.message || "Failed to delete video");
//       }
//     } catch (err: any) {
//       error(err?.response?.data?.message || "Failed to delete video");
//     } finally {
//       setLoading(false);
//       setConfirmVideoId(null);
//     }
//   };

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

            {/* three dots */}
            <div
              className={styles.durationBadge1}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === item._id ? null : item._id);
              }}
            >
              ⋮
            </div>

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

      {/* ✅ CONFIRM MODAL */}
      {/* {confirmVideoId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Delete Video?</h3>
            <p>This action cannot be undone.</p>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmVideoId(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
