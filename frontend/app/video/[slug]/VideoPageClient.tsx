"use client";

import { useParams } from "next/navigation";
import styles from "./video.module.scss";
import Navbar2 from "@/src/components/Navbar2/Navbar2";
import { decodeFilename } from "@/src/functions";
import BackgroundLayers from "@/src/components/HomePage/BackgroundLayers/BackgroundLayers";
import UpNextSidebar from "@/src/components/shared/upnextsidebar/UpNextSidebar";
import VideoPlayer from "@/src/components/VideoPage/VideoPlayer/VideoPlayer";
import VideoMeta from "@/src/components/VideoPage/VideoMeta/VideoMeta";
import VideoActions from "@/src/components/VideoPage/VideoActions/VedioActions";
import VideoDescription from "@/src/components/VideoPage/VedioDescription/VideoDescription";
import CommentsSection from "@/src/components/ui/CommentSection/CommentSection";
import { getVideoMetadataExceptCommentsDocs } from "@/src/lib/video/videodata";
import { useEffect, useRef, useState } from "react";
import { getVideoId } from "@/src/utils/videoStorage";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";

export default function VideoPageClient() {
  const params = useParams();
  const slug = params?.slug;
  const encoded = Array.isArray(slug) ? slug[0] : slug;

  const decoded = encoded ? decodeFilename(encoded) : "";
  const id = decoded.slice(-24);
  const filePath = decoded.slice(0, -24);
  const fallbackVideoUrl = `https://storage.googleapis.com/vidorahub/${filePath}`;
  // console.log("decoded",decoded)
  // console.log("url",fallbackVideoUrl)
  // console.log("id",id)
  // console.log("file Path",filePath)
  const videoId = getVideoId() || id;
  const item = localStorage.setItem("currentVideoId", id);

  const [videoMeta, setVideoMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1000);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!videoId) return;

    const fetchMeta = async () => {
      try {
        setLoading(true);
        const res = await getVideoMetadataExceptCommentsDocs(videoId);
        setVideoMeta(res.data?.data); // ✅ CORRECT FIX
      } catch (error) {
        console.error("Failed to fetch video metadata", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [videoId]);

  // ✅ Adaptive Streaming Logic
  const finalVideoSrc = (() => {
    if (!videoMeta) return fallbackVideoUrl;

    const isReady = videoMeta?.Status === "ready";
    const hasHls = !!videoMeta?.hlsUl;

    if (isReady && hasHls) {
      return `https://storage.googleapis.com/vidorahub/${videoMeta.hlsUl}/master.m3u8`;
    }

    return videoMeta?.videoUrl || fallbackVideoUrl;
  })();

  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;

    if (diff > 50 && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }

    if (diff < -50 && activeTab < 2) {
      setActiveTab(activeTab + 1);
    }
  };

  return (
    <div className={styles.page}>
      <BackgroundLayers />

      <div className={styles.sidebar}>
        <Sidebar />
      </div>

      <Navbar2 />

      {!isMobile ? (
        <div className={styles.layout}>
          <div className={styles.leftSidebar}>
            <UpNextSidebar />
          </div>

          <main className={styles.center}>
            <div className={styles.fixedPlayer}>
              <VideoPlayer src={finalVideoSrc} videoId={videoId!} />
            </div>
            {/* ✅ Adaptive source passed here */}

            <div className={styles.topMeta}>
              {!loading && videoMeta && (
                <>
                  <VideoMeta
                    title={videoMeta.title}
                    category={videoMeta.tags?.[0] || "General"}
                    published={new Date(videoMeta.createdAt).toDateString()}
                    uploader={videoMeta.uploader}
                  />

                  <VideoActions
                    videoSerialNumber={videoMeta.videoSerialNumber}
                    thumbnailUrl={videoMeta.thumbnailUrl}
                  />
                </>
              )}
            </div>

            <div className={styles.resourcesRow}>
              {!loading && videoMeta && (
                <VideoDescription
                  views={videoMeta.stats?.views?.toLocaleString() || "0"}
                  uploaded={new Date(videoMeta.createdAt).toDateString()}
                  hashtags={videoMeta.tags}
                  description={videoMeta.description}
                />
              )}
            </div>
          </main>

          <div className={styles.rightSidebar}>
            <CommentsSection />
          </div>
        </div>
      ) : (
          <div >
        <div className={styles.mobileLayout}>
          <VideoPlayer src={finalVideoSrc} videoId={videoId!} />

          {/* TABS */}
          <div className={styles.mobileTabs}>
            {["Info", "UpNext", "Comments"].map((tab, index) => (
              <button
                key={index}
                className={`${styles.tab} ${activeTab === index ? styles.active : ""}`}
                onClick={() => setActiveTab(index)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* SWIPE CONTAINER */}
          <div
            className={styles.mobileSwipe}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ transform: `translateX(-${activeTab * 100}%)` }}
          >
            {/* INFO */}
            <div
              className={`${styles.mobileSection} ${
                activeTab === 0 ? styles.active : ""
              }`}
            >
              <main className={styles.center}>
           
            {/* ✅ Adaptive source passed here */}

            <div className={styles.topMeta}>
              {!loading && videoMeta && (
                <>
                  <VideoMeta
                    title={videoMeta.title}
                    category={videoMeta.tags?.[0] || "General"}
                    published={new Date(videoMeta.createdAt).toDateString()}
                    uploader={videoMeta.uploader}
                  />

                  <VideoActions
                    videoSerialNumber={videoMeta.videoSerialNumber}
                    thumbnailUrl={videoMeta.thumbnailUrl}
                  />
                </>
              )}
            </div>

            <div className={styles.resourcesRow}>
              {!loading && videoMeta && (
                <VideoDescription
                  views={videoMeta.stats?.views?.toLocaleString() || "0"}
                  uploaded={new Date(videoMeta.createdAt).toDateString()}
                  hashtags={videoMeta.tags}
                  description={videoMeta.description}
                />
              )}
            </div>
          </main>
            </div>

            {/* UP NEXT */}
            <div
              className={`${styles.mobileSection} ${
                activeTab === 1 ? styles.active : ""
              }`}
            >
              <UpNextSidebar />
            </div>

            {/* COMMENTS */}
            <div
              className={`${styles.mobileSection} ${
                activeTab === 2 ? styles.active : ""
              }`}
            >
              <CommentsSection />
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useParams } from "next/navigation";
// import styles from "./video.module.scss";
// import Navbar2 from "@/src/components/Navbar2/Navbar2";
// import { decodeFilename } from "@/src/functions";
// import BackgroundLayers from "@/src/components/HomePage/BackgroundLayers/BackgroundLayers";
// import UpNextSidebar from "@/src/components/shared/upnextsidebar/UpNextSidebar";
// import VideoPlayer from "@/src/components/VideoPage/VideoPlayer/VideoPlayer";
// import VideoMeta from "@/src/components/VideoPage/VideoMeta/VideoMeta";
// import VideoActions from "@/src/components/VideoPage/VideoActions/VedioActions";
// import VideoDescription from "@/src/components/VideoPage/VedioDescription/VideoDescription";
// import CommentsSection from "@/src/components/ui/CommentSection/CommentSection";
// import { getVideoMetadataExceptCommentsDocs } from "@/src/lib/video/videodata";
// import { useEffect, useState } from "react";
// import { getVideoId } from "@/src/utils/videoStorage";
// import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";

// export default function VideoPageClient() {
//   const params = useParams();
//   const slug = params?.slug;
//   const encoded = Array.isArray(slug) ? slug[0] : slug;

//   const videoId = getVideoId();

//   const decoded = encoded ? decodeFilename(encoded) : "";
//   // const videoUrl = `https://storage.googleapis.com/vidorahub/${decoded}`;

//   const [videoMeta, setVideoMeta] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const finalVideoSrc = (() => {
//     if (!videoMeta?.data) return "";

//     const status = videoMeta.data?.Status; // capital S (as per your schema)
//     const hlsPath = videoMeta.data?.hlsUl;

//     // If ready and HLS exists → use HLS
//     if (status === "ready" && hlsPath) {
//       return `https://storage.googleapis.com/vidorahub/${hlsPath}/index.m3u8`;
//     }

//     // Otherwise fallback to normal MP4
//     return videoMeta.data?.videoUrl;
//   })();

//   useEffect(() => {
//     if (!videoId) return;

//     const fetchMeta = async () => {
//       try {
//         setLoading(true);
//         const res = await getVideoMetadataExceptCommentsDocs(videoId);
//         setVideoMeta(res.data);
//       } catch (error) {
//         console.error("Failed to fetch video metadata", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMeta();
//   }, [videoId]);

//   // console.log("vedio meta data", videoMeta)

//   return (
//     <div className={styles.page}>
//       <BackgroundLayers />
//       <div className={styles.sidebar}>
//         <Sidebar />
//       </div>

//       <Navbar2 />

//       <div className={styles.layout}>
//         <div className={styles.leftSidebar}>
//           <UpNextSidebar />
//         </div>

//         <main className={styles.center}>
//           <VideoPlayer src={finalVideoSrc} videoId={videoId!} />

//           <div className={styles.topMeta}>
//             {!loading && videoMeta && (
//               <VideoMeta
//                 title={videoMeta.data?.title}
//                 category={videoMeta.data?.tags?.[0] || "General"}
//                 published={new Date(videoMeta.data?.createdAt).toDateString()}
//                 uploader={videoMeta.data?.uploader}
//               />
//             )}

//             {!loading && videoMeta && (
//               <VideoActions
//                 videoSerialNumber={videoMeta.data?.videoSerialNumber}
//                 thumbnailUrl={videoMeta.data?.thumbnailUrl}
//               />
//             )}
//           </div>

//           <div className={styles.resourcesRow}>
//             <div>
//               {!loading && videoMeta && (
//                 <VideoDescription
//                   views={videoMeta.data?.stats.views.toLocaleString()}
//                   uploaded={new Date(videoMeta.data?.createdAt).toDateString()}
//                   hashtags={videoMeta.data?.tags}
//                   description={videoMeta.data?.description}
//                 />
//               )}
//             </div>
//           </div>
//         </main>

//         <div className={styles.rightSidebar}>
//           <CommentsSection />
//         </div>
//       </div>
//     </div>
//   );
// }
