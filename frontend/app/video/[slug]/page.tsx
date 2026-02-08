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
import { useEffect, useState } from "react";
import { getVideoId } from "@/src/utils/videoStorage";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";

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
      <div className={styles.sidebar}>

      <Sidebar/>

      </div>

      <Navbar2 />

      <div className={styles.layout}>
        
        <div className={styles.leftSidebar}>
          <UpNextSidebar
            
          />
        </div>

        <main className={styles.center}>
          
          <VideoPlayer src={videoUrl} videoId={videoId!}/>

          <div className={styles.topMeta}>
            {!loading && videoMeta && (
                <VideoMeta
                  title={videoMeta.data?.title}
                  category={videoMeta.data?.tags?.[0] || "General"}
                  published={new Date(videoMeta.data?.createdAt).toDateString()}
                  uploader={videoMeta.data?.uploader}
                />
              )}


            {/* <VideoActions likes="42K" /> */}
            {!loading && videoMeta && (
            // <VideoActions likes={videoMeta.data?.stats.likes.toString()} 
            //     videoSerialNumber={videoMeta.data?.videoSerialNumber}
            //     dislike={videoMeta.data?.stats.dislikes.toString()}
            //     />
            //infuture we have to add a fallback layer
            <VideoActions videoSerialNumber={videoMeta.data?.videoSerialNumber}/>
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

        
        <div className={styles.rightSidebar}>
          <CommentsSection/>
            
        </div>

      </div>
    </div>
  );
}
