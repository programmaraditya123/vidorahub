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
// import ResourcesCard from "@/src/components/shared/resourcescard/ResourcesCard";
import CommentsSection from "@/src/components/ui/CommentSection/CommentSection";
import { getVideoMetadataExceptCommentsDocs } from "@/src/lib/video/videodata";
import { useEffect, useState } from "react";
import { getVideoId } from "@/src/utils/videoStorage";

export default function Page () {
  const params = useParams();
  const slug = params?.slug;
  const encoded = Array.isArray(slug) ? slug[0] : slug;

  const videoId = getVideoId()

  const decoded = encoded ? decodeFilename(encoded) : "";
  const videoUrl = `https://storage.googleapis.com/vidorahub/${decoded}`;
  const [videoMeta, setVideoMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    if (!videoId) return;

    const fetchMeta = async () => {
      try {
        setLoading(true);
        const res = await getVideoMetadataExceptCommentsDocs(videoId);
        setVideoMeta(res.data);
      } catch (error) {
        console.error("Failed to fetch video metadata", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [videoId]);


  return (
    <div className={styles.page}>
      
      <BackgroundLayers />

      <Navbar2 />

      <div className={styles.layout}>
        
        <div className={styles.leftSidebar}>
          <UpNextSidebar
            autoplay={true}
            videos={[
              {
                id: "1",
                title: "The Ultimate Guide to CSS Grid Layouts",
                channel: "CodeCraft",
                views: "1.2M",
                uploaded: "3 days ago",
                duration: "12:34",
                thumbnail: "/th",
              },
              {
                id: "2",
                title: "5 UI Design Trends to Watch in 2024",
                channel: "PixelPerfect",
                views: "800K",
                uploaded: "1 week ago",
                duration: "8:05",
                thumbnail: "/th",
              },
            ]}
          />
        </div>

        <main className={styles.center}>
          
          <VideoPlayer src={videoUrl} />

          <div className={styles.topMeta}>
            {!loading && videoMeta && (
                <VideoMeta
                  title={videoMeta.data?.title}
                  category={videoMeta.data?.tags?.[0] || "General"}
                  published={new Date(videoMeta.data?.createdAt).toDateString()}
                />
              )}


            {/* <VideoActions likes="42K" /> */}
            {!loading && videoMeta && (
            <VideoActions likes={videoMeta.data?.stats.likes.toString()} />
          )}

          </div>

          <div className={styles.resourcesRow}>
            <div>
              {!loading && videoMeta && (
                  <VideoDescription
                    views={videoMeta.data?.stats.views.toLocaleString()}
                    uploaded={new Date(videoMeta.data?.createdAt).toDateString()}
                    hashtags={videoMeta.data?.tags}
                    description={videoMeta.data?.description}
                  />
                )}

            </div>

            {/* <div>
              <ResourcesCard
                filename="Project_Assets.zip"
                size="24.5 MB • ZIP/PDF"
                onDownload={() => console.log("download zip")}
              />

              <div className={styles.licenseBox}>
                <span className="material-symbols-outlined">info</span>
                <p>CC BY-NC 4.0 International License Applied</p>
              </div>
            </div> */}
          </div>
        </main>

        {/* RIGHT SIDEBAR — COMMENTS */}
        <div className={styles.rightSidebar}>
          <CommentsSection/>
            
        </div>

      </div>
    </div>
  );
}
