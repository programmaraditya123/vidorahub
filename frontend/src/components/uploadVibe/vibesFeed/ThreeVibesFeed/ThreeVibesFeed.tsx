"use client";

import { http } from "@/src/lib/http";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import styles from "./ThreeVibesFeed.module.scss";
import VibeActions from "../../VibeActionsSidebar/VibeActions";
import VibeMeta from "../../VibeMeta/VibeMeta";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import { useRouter, useSearchParams } from "next/navigation";

interface VibeItem {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  hlsUl?: string;
  stats: { views: number };
  uploader: {
    _id: string;
    name: string;
    profilePicture?: string;
    subscriber: number;
    userSerialNumber: number;
  };
  videoSerialNumber: number;
}

const ThreeVibesFeed = () => {
  const [vibes, setVibes] = useState<VibeItem[]>([]);
  const [cursor, setCursor] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollAccumulator = useRef(0);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const router = useRouter();
const searchParams = useSearchParams();

  // 🔥 control refs
  //   const isScrolling = useRef(false);
  const lastScrollTime = useRef(0);

  // 🔥 LOAD DATA
  const loadVibes = async () => {
    if (!hasMore) return;

    try {
      const res = await http.get("/api/v1/allvibes", {
        params: { limit: 3, cursor },
      });

      setVibes((prev) => [...prev, ...res.data.items]);

      setHasMore(res.data.hasMore);

      if (res.data.nextCursor) {
        setCursor(res.data.nextCursor);
      }
    } catch (err) {
      console.log("load error", err);
    }
  };

  // 🔥 SET VIDEO SOURCE
  const setVideoSource = (vibe: VibeItem) => {
    const video = videoRef.current;
    if (!video) return;

    // reset
    video.pause();
    video.currentTime = 0;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (vibe.hlsUl && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 8,
        maxMaxBufferLength: 15,
      });

      const src = `https://storage.googleapis.com/vidorahub/${vibe.hlsUl}/master.m3u8`;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hlsRef.current = hls;
    } else {
      video.src = vibe.videoUrl;

      video.onloadeddata = () => {
        video.play().catch(() => {});
      };
    }
  };

  // 🔥 INITIAL LOAD
  useEffect(() => {
    loadVibes();
  }, []);

  // 🔥 PLAY VIDEO
  useEffect(() => {
    if (!vibes[currentIndex]) return;

    setVideoSource(vibes[currentIndex]);

    // preload next
    if (vibes[currentIndex + 1]) {
      const next = document.createElement("video");
      next.src = vibes[currentIndex + 1].videoUrl;
      next.preload = "auto";
    }

    // fetch more
    if (currentIndex >= vibes.length - 2 && hasMore) {
      loadVibes();
    }
  }, [currentIndex, vibes]);

  // 🔥 SCROLL HANDLER WITH CONTROL
  const handleScroll = (direction: "up" | "down") => {
    const now = Date.now();

    // smooth but responsive
    if (now - lastScrollTime.current < 500) return;

    lastScrollTime.current = now;

    setCurrentIndex((prev) => {
      if (direction === "down") {
        return Math.min(prev + 1, vibes.length - 1);
      } else {
        return Math.max(prev - 1, 0);
      }
    });
  };

  // 🔥 WHEEL
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      scrollAccumulator.current += e.deltaY;

      if (Math.abs(scrollAccumulator.current) < 100) return;

      handleScroll(scrollAccumulator.current > 0 ? "down" : "up");

      scrollAccumulator.current = 0; // reset
    };

    window.addEventListener("wheel", onWheel, { passive: true });

    return () => window.removeEventListener("wheel", onWheel);
  }, [vibes]);

  // 🔥 TOUCH
  useEffect(() => {
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY - e.changedTouches[0].clientY;

      if (Math.abs(diff) < 60) return;

      handleScroll(diff > 0 ? "down" : "up");
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [vibes]);

  const currentVibe = vibes[currentIndex];

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = 1;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };



  useEffect(() => {
  if (!vibes[currentIndex]) return;

  const id = vibes[currentIndex]._id;

  const params = new URLSearchParams(searchParams.toString());
  params.set("v", id);

  router.replace(`?${params.toString()}`);
}, [currentIndex, vibes]);

const initialVideoIdRef = useRef<string | null>(null);

useEffect(() => {
  const idFromUrl = searchParams.get("v");

  if (idFromUrl) {
    initialVideoIdRef.current = idFromUrl;
  }

  loadVibes(); // normal load
}, []);

useEffect(() => {
  if (!initialVideoIdRef.current || vibes.length === 0) return;

  const index = vibes.findIndex(
    (v) => v._id === initialVideoIdRef.current
  );

  if (index !== -1) {
    setCurrentIndex(index);
    initialVideoIdRef.current = null; // prevent re-run
  } else {
    // 🔥 NOT FOUND → LOAD MORE UNTIL FOUND
    if (hasMore) {
      loadVibes();
    }
  }
}, [vibes]);

  return (
    <div className={styles.feed}>
      <div className={styles.vibeCard}>
        <video
          ref={videoRef}
          className={styles.video}
          poster={currentVibe?.thumbnailUrl}
          onClick={handleVideoClick}
          playsInline
          muted={isMuted}
          loop
          autoPlay
        />

        {currentVibe && (
          <>
            <VibeActions
              videoSerialNumber={currentVibe.videoSerialNumber}
              thumbnailUrl={currentVibe.thumbnailUrl || ""}
              totalViews={currentVibe.stats.views}
            />

            <div className={styles.overlay}>
              <VibeMeta uploader={currentVibe.uploader} />
              <p>{currentVibe.title}</p>

              {currentVibe.description && <p>{currentVibe.description}</p>}
            </div>
          </>
        )}
        <div className={styles.soundIcon}>{isMuted ? <VidorahubIcon.MutedIcon/> : ""}</div>
      </div>
    </div>
  );
};

export default ThreeVibesFeed;
