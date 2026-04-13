"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import styles from "./VideoCard.module.scss";
import fallbackThumbnail from "../../../images/sample1.png";
import { encodeFilename } from "@/src/functions";
import { setVideoId } from "@/src/utils/videoStorage";

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

export default function VideoCard({ video }: { video: Video }) {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  // ✅ Pre-compute the target URL once — not on every click
  const targetUrl = useRef<string | null>(null);
  useEffect(() => {
    if (!video.videoUrl) return;
    const lastPart = video.videoUrl.split("vidorahub/")[1];
    if (!lastPart) return;
    const encoded = encodeFilename(lastPart + video._id);
    targetUrl.current = `/video/${encoded}`;
  }, [video.videoUrl, video._id]);

  // ✅ Prefetch on hover — Next.js loads the JS bundle for /video/[slug]
  //    before the user even clicks, so navigation feels instant
  const handleMouseEnter = useCallback(() => {
    if (prefetchedRef.current || !targetUrl.current) return;
    prefetchedRef.current = true;
    router.prefetch(targetUrl.current);
  }, [router]);

  // ✅ Also prefetch on touch start (mobile — no hover event)
  const handleTouchStart = useCallback(() => {
    if (prefetchedRef.current || !targetUrl.current) return;
    prefetchedRef.current = true;
    router.prefetch(targetUrl.current);
  }, [router]);

  const handleNavigate = useCallback(() => {
    if (!targetUrl.current) return;

    // ✅ Non-blocking: defer localStorage writes to after navigation starts.
    //    requestIdleCallback / setTimeout(0) lets the browser paint the new
    //    route first, then flush storage in the idle gap.
    if (video._id) {
      setVideoId(video._id);
      const thumb = video.thumbnailUrl;
      if (thumb) {
        // Use queueMicrotask so it runs after the current call stack but
        // before the next paint — fast enough, never blocks the click handler
        queueMicrotask(() => {
          localStorage.setItem("thubnailUrl", thumb);
          localStorage.setItem("currentVideoId", video._id);
        });
      }
    }

    // ✅ router.push is now near-instant because the bundle was prefetched
    router.push(targetUrl.current);
  }, [router, video._id, video.thumbnailUrl]);

  const thumb = video.thumbnailUrl || fallbackThumbnail;

  return (
    <div
      className={styles.card}
      onClick={handleNavigate}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
    >
      {/* Thumbnail */}
      <div className={styles.thumbnailWrapper}>
        <Image
          src={thumb}
          alt={video.title}
          fill
          priority={false}
          className={styles.thumbnail}
          loading="lazy"
          // ✅ Hint to the browser this image may become important on hover
          fetchPriority="low"
        />

        {video.isLive && <span className={styles.liveBadge}>LIVE</span>}

        {!video.isLive && (
          <span className={styles.duration}>{video.duration || "00:00"}</span>
        )}
      </div>

      {/* Info */}
      <div className={`${styles.info} glass-dark`}>
        <div className={styles.avatar}>
         {video.profilePicUrl && <Image
            src={video.profilePicUrl}
            alt={video.title}
            priority={false}
            className={styles.thumbnail}
            loading="lazy"
            // ✅ Hint to the browser this image may become important on hover
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

// "use client";

// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useCallback } from "react";

// import styles from "./VideoCard.module.scss";
// import fallbackThumbnail from "../../../images/sample1.png";
// import { encodeFilename } from "@/src/functions";
// import { setVideoId } from "@/src/utils/videoStorage";

// type Video = {
//   _id: string;
//   title: string;
//   description?: string;
//   creatorName?: string;
//   videoUrl?: string;
//   views?: number | string;
//   duration?: string;
//   thumbnailUrl?: string;
//   isLive?: boolean;
// };

// export default function VideoCard({ video }: { video: Video }) {
//   const router = useRouter();
//   // const dispatch =  useAppDispatch()

//   const handleNavigate = useCallback(() => {
//     if (!video.videoUrl) return;

//     if(video?._id){
//     // dispatch(setVideoId(video?._id))
//     setVideoId(video?._id)
//     localStorage.setItem("thubnailUrl",video?.thumbnailUrl!)
//   }

//     const lastPart = video.videoUrl.split("vidorahub/")[1];
//     const encoded = encodeFilename(lastPart!+`${video?._id}`);

//     router.push(`/video/${encoded}`);
//   }, [router, video.videoUrl]);

//   const thumb = video.thumbnailUrl || fallbackThumbnail;

//   return (
//     <div className={styles.card} onClick={handleNavigate}>
//       {/* Thumbnail */}
//       <div className={styles.thumbnailWrapper}>
//         <Image
//           src={thumb}
//           alt={video.title}
//           fill
//           priority={false}
//           className={styles.thumbnail}
//           loading="lazy"
//         />

//         {/* Live badge */}
//         {video.isLive && <span className={styles.liveBadge}>LIVE</span>}

//         {/* Duration */}
//         {!video.isLive && (
//           <span className={styles.duration}>
//             {video.duration || "00:00"}
//           </span>
//         )}
//       </div>

//       {/* Info */}
//       <div className={`${styles.info} glass-dark`}>
//         <div className={styles.avatar}></div>

//         <div className={styles.meta}>
//           <p className={styles.title}>{video.title}</p>

//           <span className={styles.creator}>
//             {video.creatorName || "Creator"}
//           </span>

//           {!video.isLive && (
//             <span className={styles.views}>
//               {video.views} views
//             </span>
//           )}

//           {video.isLive && (
//             <span className={styles.liveText}>🔴 Live now</span>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
