"use client";

import { useEffect, useState } from "react";
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

export default function Masonry() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadVideos = async () => {
      try {
        const res = await getVideos();
        if (mounted) {
          setVideos(res?.data?.items || []);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadVideos();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={`${styles.masonry} masonry-grid`}>
      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className={`${styles.item} masonry-item`}>
              <VideoCardSkeleton />
            </div>
          ))
        : videos.map((video) => (
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
    </div>
  );
}







// "use client";

// import { useEffect, useState } from "react";
// import { getVideos } from "@/src/lib/video/uploadvideo";

// import styles from "./Masonry.module.scss";
// import VideoCard from "../VideoCard/VideoCard";
// import { formatDuration } from "@/src/utils/extractFrames";
// import VideoCardSkeleton from "../VideoCard/VideoCardSkeleton/VideoCardSkeleton";

// type Video = {
//   _id: string;
//   title: string;
//   description: string;
//   creatorName?: string;
//   videoUrl?: string;
//   thumbnailUrl?: string;
//   duration?: string | number;
//   views?: number;
//   stats?: {
//     views?: number;
//   };
//   uploader ?: {
//     name ?: string;
//   }
// };


// export default function Masonry() {
//   const [videos, setVideos] = useState<Video[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadVideos = async () => {
//       try {
//         const res = await getVideos();
//         setVideos(res?.data?.items || []);
//       } catch (err) {
//         console.error("Error fetching videos:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadVideos();
//   }, []);

//   if (loading) return <div className={styles.loading}><VideoCardSkeleton/></div>;

//   return (
//     <div className={`${styles.masonry} masonry-grid`}>
//       {videos.map((video) => (
//         <div key={video._id} className={`${styles.item} masonry-item`}>
//           <VideoCard
//               key={video._id}
//               video={{
//                 _id: video._id,
//                 title: video.title,
//                 creatorName: video.uploader?.name, 
//                 thumbnailUrl: video.thumbnailUrl as string,
//                 duration: formatDuration(Number(video?.duration)),
//                 views: video.stats?.views || 0,
//                 videoUrl: video.videoUrl,
//               }}
//             />
//           {/* /> */}
//         </div>
//       ))}
//     </div>
//   );
// }
