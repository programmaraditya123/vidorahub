"use client";

import { http } from "@/src/lib/http";
import { useCallback, useEffect, useRef, useState } from "react";
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

const FETCH_AHEAD_THRESHOLD = 2;

// ─── Per-slide video component ────────────────────────────────────────────────

interface VibeSlideProps {
  vibe: VibeItem;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

const VibeSlide = ({ vibe, isActive, isMuted, onToggleMute }: VibeSlideProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showMuteHint, setShowMuteHint] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Attach HLS / plain source once on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playWhenReady = () => {
      setIsReady(true);
      if (isActive) video.play().catch(() => {});
    };

    if (vibe.hlsUl && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 15,
        maxMaxBufferLength: 30,
        startFragPrefetch: true,
        lowLatencyMode: false,
      });
      hls.loadSource(
        `https://storage.googleapis.com/vidorahub/${vibe.hlsUl}/master.m3u8`
      );
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, playWhenReady);
      hlsRef.current = hls;
    } else {
      video.src = vibe.videoUrl;
      video.preload = "auto";
      video.onloadedmetadata = playWhenReady;
    }

    return () => {
      video.pause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play / pause when the slide becomes active / inactive
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, isReady]);

  // Sync mute state from parent
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    if (!isMuted) video.volume = 1;
  }, [isMuted]);

  const handleClick = () => {
    setShowMuteHint(true);
    setTimeout(() => setShowMuteHint(false), 1200);
    onToggleMute();
  };

  return (
    <div className={styles.slide}>
      {/* Skeleton shown until metadata arrives */}
      {!isReady && <div className={styles.skeleton} aria-hidden="true" />}

      <video
        ref={videoRef}
        className={styles.video}
        poster={vibe.thumbnailUrl}
        onClick={handleClick}
        playsInline
        muted={isMuted}
        loop
        autoPlay={false}
      />

      {/* Mute / unmute pop feedback */}
      <div
        className={`${styles.muteOverlay} ${showMuteHint ? styles.muteVisible : ""}`}
        aria-hidden="true"
      >
        {isMuted ? <VidorahubIcon.MutedIcon /> : null}
      </div>

      <VibeActions
        videoSerialNumber={vibe.videoSerialNumber}
        thumbnailUrl={vibe.thumbnailUrl || ""}
        totalViews={vibe.stats.views}
      />

      <div className={styles.overlay}>
        <VibeMeta uploader={vibe.uploader} key={vibe.uploader._id} />
        <p className={styles.title}>{vibe.title}</p>
        {vibe.description && (
          <p className={styles.description}>{vibe.description}</p>
        )}
      </div>
    </div>
  );
};

// ─── Feed container ───────────────────────────────────────────────────────────

const ThreeVibesFeed = () => {
  const [vibes, setVibes] = useState<VibeItem[]>([]);
  const [cursor, setCursor] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const cursorRef = useRef("");
  const initialVideoIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const vibesRef = useRef<VibeItem[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => { vibesRef.current = vibes; }, [vibes]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { cursorRef.current = cursor; }, [cursor]);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const loadVibes = useCallback(async (cursorOverride?: string) => {
    if (isFetchingRef.current || !hasMoreRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const res = await http.get("/api/v1/allvibes", {
        params: { limit: 5, cursor: cursorOverride ?? cursorRef.current },
      });
      setVibes((prev) => [...prev, ...res.data.items]);
      setHasMore(res.data.hasMore);
      if (res.data.nextCursor) setCursor(res.data.nextCursor);
    } catch (err) {
      console.error("Vibe load error:", err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // ─── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    const idFromUrl = searchParams.get("v");
    if (idFromUrl) initialVideoIdRef.current = idFromUrl;
    loadVibes("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jump to URL-specified video once vibes have loaded
  useEffect(() => {
    if (!initialVideoIdRef.current || vibes.length === 0) return;
    const index = vibes.findIndex((v) => v._id === initialVideoIdRef.current);
    if (index !== -1) {
      setCurrentIndex(index);
      initialVideoIdRef.current = null;
      // Imperatively scroll to slide without animation so it is instant on load
      slideRefs.current[index]?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    } else if (hasMore) {
      loadVibes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vibes]);

  // ─── IntersectionObserver — detect which slide is active ────────────────────

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = slideRefs.current.findIndex((el) => el === entry.target);
          if (idx === -1) continue;

          setCurrentIndex(idx);

          // Update URL
          const vibe = vibesRef.current[idx];
          if (vibe) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("v", vibe._id);
            router.replace(`?${params.toString()}`);
          }

          // Fetch more when nearing the end
          if (idx >= vibesRef.current.length - FETCH_AHEAD_THRESHOLD && hasMoreRef.current) {
            loadVibes();
          }
        }
      },
      {
        root: feed,
        // Fire when slide is ≥ 60% visible — avoids flickering between two slides
        threshold: 0.6,
      }
    );

    // Observe all current slides
    slideRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
    // Re-run whenever the number of slides changes so new slides get observed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vibes.length]);

  // ─── Keyboard navigation ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const total = vibesRef.current.length;
      if (e.key === "ArrowDown" || e.key === "j") {
        const next = Math.min(currentIndex + 1, total - 1);
        slideRefs.current[next]?.scrollIntoView({ behavior: "smooth" });
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        const prev = Math.max(currentIndex - 1, 0);
        slideRefs.current[prev]?.scrollIntoView({ behavior: "smooth" });
      }
      if (e.key === " " || e.key === "m") {
        e.preventDefault();
        setIsMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={feedRef} className={styles.feed}>
      {vibes.map((vibe, i) => (
        <div
          key={vibe._id}
          ref={(el) => { slideRefs.current[i] = el; }}
          className={styles.slideWrapper}
        >
          <VibeSlide
            vibe={vibe}
            isActive={i === currentIndex}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted((m) => !m)}
          />
        </div>
      ))}

      {/* End-of-feed loading indicator */}
      {isLoading && (
        <div className={styles.loadingMore} aria-label="Loading more vibes…">
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
        </div>
      )}
    </div>
  );
};

export default ThreeVibesFeed;


// "use client";

// import { http } from "@/src/lib/http";
// import { useCallback, useEffect, useRef, useState } from "react";
// import Hls from "hls.js";
// import styles from "./ThreeVibesFeed.module.scss";
// import VibeActions from "../../VibeActionsSidebar/VibeActions";
// import VibeMeta from "../../VibeMeta/VibeMeta";
// import VidorahubIcon from "@/src/icons/VidorahubIcon";
// import { useRouter, useSearchParams } from "next/navigation";

// interface VibeItem {
//   _id: string;
//   title: string;
//   description?: string;
//   thumbnailUrl?: string;
//   videoUrl: string;
//   hlsUl?: string;
//   stats: { views: number };
//   uploader: {
//     _id: string;
//     name: string;
//     profilePicture?: string;
//     subscriber: number;
//     userSerialNumber: number;
//   };
//   videoSerialNumber: number;
// }

// const SCROLL_COOLDOWN_MS = 500;
// const TOUCH_THRESHOLD_PX = 60;
// const WHEEL_THRESHOLD = 100;
// const FETCH_AHEAD_THRESHOLD = 2;
// const PRELOAD_COUNT = 2;

// const ThreeVibesFeed = () => {
//   const [vibes, setVibes] = useState<VibeItem[]>([]);
//   const [cursor, setCursor] = useState("");
//   const [hasMore, setHasMore] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isMuted, setIsMuted] = useState(true);
//   const [isLoading, setIsLoading] = useState(false);
//   const [showMuteHint, setShowMuteHint] = useState(false);

//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const hlsRef = useRef<Hls | null>(null);
//   const scrollAccumulator = useRef(0);
//   const lastScrollTime = useRef(0);
//   const isFetchingRef = useRef(false);
//   const initialVideoIdRef = useRef<string | null>(null);
//   const hasInitializedRef = useRef(false);
//   const vibesRef = useRef<VibeItem[]>([]);
//   const hasMoreRef = useRef(true);

//   const router = useRouter();
//   const searchParams = useSearchParams();

//   // Keep refs in sync for use inside event listeners
//   useEffect(() => {
//     vibesRef.current = vibes;
//   }, [vibes]);

//   useEffect(() => {
//     hasMoreRef.current = hasMore;
//   }, [hasMore]);

//   // ─── FETCH ────────────────────────────────────────────────────────────────

//   const loadVibes = useCallback(async (cursorOverride?: string) => {
//     if (isFetchingRef.current || !hasMoreRef.current) return;

//     isFetchingRef.current = true;
//     setIsLoading(true);

//     try {
//       const res = await http.get("/api/v1/allvibes", {
//         params: { limit: 5, cursor: cursorOverride ?? cursor },
//       });

//       setVibes((prev) => [...prev, ...res.data.items]);
//       setHasMore(res.data.hasMore);

//       if (res.data.nextCursor) {
//         setCursor(res.data.nextCursor);
//       }
//     } catch (err) {
//       console.error("Vibe load error:", err);
//     } finally {
//       isFetchingRef.current = false;
//       setIsLoading(false);
//     }
//   }, [cursor]);

//   // ─── HLS / VIDEO SOURCE ───────────────────────────────────────────────────

//   const destroyHls = useCallback(() => {
//     if (hlsRef.current) {
//       hlsRef.current.destroy();
//       hlsRef.current = null;
//     }
//   }, []);

//   const setVideoSource = useCallback((vibe: VibeItem) => {
//     const video = videoRef.current;
//     if (!video) return;

//     video.pause();
//     video.currentTime = 0;
//     destroyHls();

//     const playWhenReady = () => video.play().catch(() => {});

//     if (vibe.hlsUl && Hls.isSupported()) {
//       const hls = new Hls({
//         maxBufferLength: 10,
//         maxMaxBufferLength: 20,
//         startFragPrefetch: true,
//       });
//       hls.loadSource(
//         `https://storage.googleapis.com/vidorahub/${vibe.hlsUl}/master.m3u8`
//       );
//       hls.attachMedia(video);
//       hls.on(Hls.Events.MANIFEST_PARSED, playWhenReady);
//       hlsRef.current = hls;
//     } else {
//       video.removeAttribute("src");
//       video.load();
//       video.src = vibe.videoUrl;
//       video.preload = "auto";
//       video.onloadedmetadata = playWhenReady;
//       video.onerror = (e) => console.error("Video error:", e);
//     }
//   }, [destroyHls]);

//   // Preload upcoming videos into hidden <video> elements so the browser
//   // warms its cache before the user actually navigates to them.
//   const preloadUpcoming = useCallback((fromIndex: number) => {
//     for (let i = 1; i <= PRELOAD_COUNT; i++) {
//       const v = vibesRef.current[fromIndex + i];
//       if (!v) break;
//       const el = document.createElement("video");
//       el.src = v.videoUrl;
//       el.preload = "auto";
//       el.muted = true;
//     }
//   }, []);

//   // ─── INIT ─────────────────────────────────────────────────────────────────

//   useEffect(() => {
//     if (hasInitializedRef.current) return;
//     hasInitializedRef.current = true;

//     const idFromUrl = searchParams.get("v");
//     if (idFromUrl) initialVideoIdRef.current = idFromUrl;

//     loadVibes("");
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Jump to the URL-specified video once vibes are loaded
//   useEffect(() => {
//     if (!initialVideoIdRef.current || vibes.length === 0) return;

//     const index = vibes.findIndex((v) => v._id === initialVideoIdRef.current);

//     if (index !== -1) {
//       setCurrentIndex(index);
//       initialVideoIdRef.current = null;
//     } else if (hasMore) {
//       loadVibes();
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [vibes]);

//   // ─── PLAY CURRENT + PRELOAD NEXT ──────────────────────────────────────────

//   useEffect(() => {
//     if (!vibes[currentIndex]) return;

//     setVideoSource(vibes[currentIndex]);
//     preloadUpcoming(currentIndex);

//     // Sync URL
//     const params = new URLSearchParams(searchParams.toString());
//     params.set("v", vibes[currentIndex]._id);
//     router.replace(`?${params.toString()}`);

//     // Fetch more when approaching the end
//     if (currentIndex >= vibes.length - FETCH_AHEAD_THRESHOLD && hasMore) {
//       loadVibes();
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentIndex, vibes.length]);

//   // ─── NAVIGATION ───────────────────────────────────────────────────────────

//   const navigate = useCallback((direction: "up" | "down") => {
//     const now = Date.now();
//     if (now - lastScrollTime.current < SCROLL_COOLDOWN_MS) return;
//     lastScrollTime.current = now;

//     setCurrentIndex((prev) => {
//       const total = vibesRef.current.length;
//       if (direction === "down") return Math.min(prev + 1, total - 1);
//       return Math.max(prev - 1, 0);
//     });
//   }, []);

//   // Wheel
//   useEffect(() => {
//     const onWheel = (e: WheelEvent) => {
//       scrollAccumulator.current += e.deltaY;
//       if (Math.abs(scrollAccumulator.current) < WHEEL_THRESHOLD) return;
//       navigate(scrollAccumulator.current > 0 ? "down" : "up");
//       scrollAccumulator.current = 0;
//     };
//     window.addEventListener("wheel", onWheel, { passive: true });
//     return () => window.removeEventListener("wheel", onWheel);
//   }, [navigate]);

//   // Touch
//   useEffect(() => {
//     let touchStartY = 0;
//     const onTouchStart = (e: TouchEvent) => {
//       touchStartY = e.touches[0].clientY;
//     };
//     const onTouchEnd = (e: TouchEvent) => {
//       const diff = touchStartY - e.changedTouches[0].clientY;
//       if (Math.abs(diff) < TOUCH_THRESHOLD_PX) return;
//       navigate(diff > 0 ? "down" : "up");
//     };
//     window.addEventListener("touchstart", onTouchStart, { passive: true });
//     window.addEventListener("touchend", onTouchEnd, { passive: true });
//     return () => {
//       window.removeEventListener("touchstart", onTouchStart);
//       window.removeEventListener("touchend", onTouchEnd);
//     };
//   }, [navigate]);

//   // Keyboard
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "ArrowDown" || e.key === "j") navigate("down");
//       if (e.key === "ArrowUp" || e.key === "k") navigate("up");
//       if (e.key === " " || e.key === "m") toggleMute();
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [navigate]);

//   // Cleanup HLS on unmount
//   useEffect(() => () => destroyHls(), [destroyHls]);

//   // ─── MUTE TOGGLE ─────────────────────────────────────────────────────────

//   const toggleMute = useCallback(() => {
//     const video = videoRef.current;
//     if (!video) return;

//     const next = !isMuted;
//     video.muted = next;
//     if (!next) video.volume = 1;
//     setIsMuted(next);

//     // Briefly flash the hint icon
//     setShowMuteHint(true);
//     setTimeout(() => setShowMuteHint(false), 1200);
//   }, [isMuted]);

//   // ─── RENDER ───────────────────────────────────────────────────────────────

//   const currentVibe = vibes[currentIndex];

//   return (
//     <div className={styles.feed}>
//       <div className={styles.vibeCard}>
//         {/* Loading skeleton shown before first vibe loads */}
//         {!currentVibe && isLoading && (
//           <div className={styles.skeleton} aria-label="Loading…" />
//         )}

//         <video
//           ref={videoRef}
//           className={styles.video}
//           poster={currentVibe?.thumbnailUrl}
//           onClick={toggleMute}
//           playsInline
//           muted={isMuted}
//           loop
//           autoPlay
//         />

//         {/* Animated mute/unmute feedback */}
//         <div
//           className={`${styles.muteOverlay} ${showMuteHint ? styles.muteVisible : ""}`}
//           aria-hidden="true"
//         >
//           {isMuted ? (
//             <VidorahubIcon.MutedIcon />
//           ) : (
//             ''
//           )}
//         </div>

//         {currentVibe && (
//           <>
//             <VibeActions
//               videoSerialNumber={currentVibe.videoSerialNumber}
//               thumbnailUrl={currentVibe.thumbnailUrl || ""}
//               totalViews={currentVibe.stats.views}
//             />

//             <div className={styles.overlay}>
//               <VibeMeta uploader={currentVibe.uploader} key={currentVibe.uploader._id} />

//               <p className={styles.title}>{currentVibe.title}</p>

//               {currentVibe.description && (
//                 <p className={styles.description}>{currentVibe.description}</p>
//               )}
//             </div>
//           </>
//         )}

//         {/* Navigation dots for spatial awareness */}
//         {vibes.length > 1 && (
//           <div className={styles.dotTrack} aria-label="Video progress">
//             {vibes.map((_, i) => (
//               <button
//                 key={i}
//                 className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ""}`}
//                 onClick={() => setCurrentIndex(i)}
//                 aria-label={`Go to video ${i + 1}`}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ThreeVibesFeed;