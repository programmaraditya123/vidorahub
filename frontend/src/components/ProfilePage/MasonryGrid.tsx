"use client";

import { formatDuration } from "@/src/utils/extractFrames";
import styles from "../../../app/profile/Profile.module.scss";
import { setVideoId } from "@/src/utils/videoStorage";
import { encodeFilename } from "@/src/functions";
import { useRouter } from "next/navigation";

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

export default function MasonryGrid({ uploads }: MasonryGridProps) {
  const router = useRouter();

  const handleNavigate = (video: UploadVideo) => {
    if (!video.videoUrl) return;
    setVideoId(video._id);

    const lastPart = video.videoUrl.split("vidorahub/")[1];
    const encoded = encodeFilename(lastPart);
    router.push(`/video/${encoded}`);
  };

  return (
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

          {/* duration badge */}
          <div className={styles.durationBadge}>
            {formatDuration(item.duration)}
          </div>

          {/* bottom pill overlay */}
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
  );
}




// import { formatDuration } from "@/src/utils/extractFrames";
// import styles from "../../../app/profile/Profile.module.scss";
// import { setVideoId } from "@/src/utils/videoStorage";
// import { encodeFilename } from "@/src/functions";
// import { useRouter } from "next/navigation";

// type VideoStats = {
//   views: number;
// };

// export type UploadVideo = {
//   _id: string;
//   title: string;
//   thumbnailUrl: string;
//   duration: number;
//   createdAt: string;
//   visibility: "public" | "private";
//   stats: VideoStats;
//   videoUrl : string;
// };
// type MasonryGridProps = {
//   uploads: UploadVideo[];
// };


// export default function MasonryGrid({ uploads }: MasonryGridProps) {
//   const router = useRouter()
//   const getMasonryClass = (duration : number) => {
//     return styles.masonryShort;
//   };

//   const handleNavigate = (video: UploadVideo) => {
//       if (!video.videoUrl) return;
  
//       setVideoId(video._id);
  
//       const lastPart = video.videoUrl.split("vidorahub/")[1];
//       const encoded = encodeFilename(lastPart);
//       router.push(`/video/${encoded}`);
//     };

//   return (
//     <div className={styles.masonry}>
//       {uploads.map((item) => (
//         <div
//           key={item._id}   
//           className={`${styles.card} ${getMasonryClass(item.duration)} ${styles.glass}`}
//            onClick={() => handleNavigate(item)}
//         >
//           <div
//             className={styles.cardBg}
//             style={{ backgroundImage: `url(${item.thumbnailUrl})` }}  
           
//           />

//           <div className={styles.cardOverlay}>
//             <p>{item.title}</p>

//             <small>
//               {formatDuration(item.duration)}s •{" "}
//               {new Date(item.createdAt).toLocaleDateString()}
//             </small>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }
