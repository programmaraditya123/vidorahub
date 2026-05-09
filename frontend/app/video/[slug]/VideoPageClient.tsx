"use client";

import { useParams } from "next/navigation";
import styles from "./video.module.scss";
import Navbar2 from "@/src/components/Navbar2/Navbar2";
import { decodeFilename } from "@/src/functions";
import UpNextSidebar from "@/src/components/shared/upnextsidebar/UpNextSidebar";
import VideoPlayer from "@/src/components/VideoPage/VideoPlayer/VideoPlayer";
import VideoMeta from "@/src/components/VideoPage/VideoMeta/VideoMeta";
import VideoActions from "@/src/components/VideoPage/VideoActions/VedioActions";
import VideoDescription from "@/src/components/VideoPage/VedioDescription/VideoDescription";
import CommentsSection from "@/src/components/ui/CommentSection/CommentSection";
import { getVideoMetadataExceptCommentsDocs } from "@/src/lib/video/videodata";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";

export default function VideoPageClient() {
  const params = useParams();
  const slug = params?.slug;
  const encoded = Array.isArray(slug) ? slug[0] : slug;
  const decoded = encoded ? decodeFilename(encoded) : "";

  // ✅ Memoized: don't recompute on every render
  const { id, filePath, fallbackVideoUrl } = useMemo(() => {
    const id = decoded.slice(-24);
    const filePath = decoded.slice(0, -24);
    return {
      id,
      filePath,
      fallbackVideoUrl: `https://storage.googleapis.com/vidorahub/${filePath}`,
    };
  }, [decoded]);

  // ✅ Read videoId once from localStorage, fallback to URL param
  const videoId = useMemo(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentVideoId") || id;
    }
    return id;
  }, [id]);

  // Persist video ID
  useEffect(() => {
    if (id) localStorage.setItem("currentVideoId", id);
  }, [id]);

  const [videoMeta, setVideoMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // ─── Responsive detection ────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1000);
    check();
    const mq = window.matchMedia("(max-width: 999px)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  // ─── Fetch video metadata ─────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    const fetchMeta = async () => {
      try {
        setLoading(true);
        const res = await getVideoMetadataExceptCommentsDocs(videoId);
        if (!cancelled) setVideoMeta(res.data?.data);
      } catch (error) {
        console.error("Failed to fetch video metadata", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMeta();
    return () => { cancelled = true; };
  }, [videoId]);

 
  const finalVideoSrc = useMemo(() => {
    if (!videoMeta) return fallbackVideoUrl;
    const isReady = videoMeta?.Status === "ready";
    const hasHls = !!videoMeta?.hlsUl;
    if (isReady && hasHls) {
      return `https://storage.googleapis.com/vidorahub/${videoMeta.hlsUl}/master.m3u8`;
    }
    return videoMeta?.videoUrl || fallbackVideoUrl;
  }, [videoMeta, fallbackVideoUrl]);

 
  const touchStartX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    setActiveTab((prev) => {
      if (diff > 50 && prev > 0) return prev - 1;
      if (diff < -50 && prev < 2) return prev + 1;
      return prev;
    });
  }, []);

  // console.log("video meta data",videoMeta.uploader)

  
  const MetaBlock = useMemo(() => {
    if (loading || !videoMeta) return null;
    return (
      <>
      <div className={styles.metablock}>
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
        <VideoDescription
          views={videoMeta.stats?.views?.toLocaleString() || "0"}
          uploaded={new Date(videoMeta.createdAt).toDateString()}
          hashtags={videoMeta.tags}
          description={videoMeta.description}
        />
        </div>
      </>
    );
  }, [loading, videoMeta]);




  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>

      <Navbar2 />

      {!isMobile ? (
        // ─── Desktop layout ────────────────────────────────────────────────
        <div className={styles.layout}>
          <div className={styles.leftSidebar}>
            <UpNextSidebar />
          </div>

          <main className={styles.center}>
            <div className={styles.fixedPlayer}>
              <VideoPlayer src={finalVideoSrc} videoId={videoId!} />
            </div>

            <div className={styles.topMeta}>{MetaBlock}</div>
          </main>

          <div className={styles.rightSidebar}>
            <CommentsSection />
          </div>
        </div>
      ) : (
        // ─── Mobile layout ─────────────────────────────────────────────────
        <div className={styles.mobileLayout}>
          <VideoPlayer src={finalVideoSrc} videoId={videoId!} />

          {/* Tab bar */}
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

          {/* Swipe container */}
          <div
            className={styles.mobileSwipe}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ transform: `translateX(-${activeTab * 100}%)` }}
          >
            <div className={styles.mobileSection}>{MetaBlock}</div>
            <div className={styles.mobileSection}><UpNextSidebar /></div>
            <div className={styles.mobileSection}><CommentsSection /></div>
          </div>
        </div>
      )}
    </div>
  );
}


