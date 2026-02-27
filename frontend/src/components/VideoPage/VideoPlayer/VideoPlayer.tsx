"use client";

import { useRef, useState, useEffect } from "react";
import styles from "./VideoPlayer.module.scss";
import { postView } from "@/src/lib/video/videodata";
import Hls from "hls.js";

interface Props {
  src: string;
  videoId: string;
}

export default function VideoPlayer({ src, videoId }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastUpdateRef = useRef(0);
  const watchStartRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>("");

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [showControls, setShowControls] = useState(true);

  const lastVolumeRef = useRef(1);

  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [qualities, setQualities] = useState<any[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = auto
  const [showQuality, setShowQuality] = useState(false);

  const formatTime = (time: number) => {
    if (!time) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play();
      setIsPlaying(true);
      watchStartRef.current = Date.now();
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.muted) {
      v.muted = false;
      v.volume = lastVolumeRef.current || 0.5;
      setVolume(v.volume);
    } else {
      lastVolumeRef.current = v.volume;
      v.muted = true;
      setVolume(0);
    }

    setMuted(v.muted);
  };

  // const toggleFullScreen = () => {
  //   const container = videoRef.current?.parentElement!;
  //   if (!document.fullscreenElement) container.requestFullscreen();
  //   else document.exitFullscreen();
  // };

 const toggleFullScreen = async () => {
  const container = videoRef.current?.parentElement;
  if (!container) return;

  try {
    if (!document.fullscreenElement) {
      await container.requestFullscreen();

      const orientation = (screen as any).orientation;

      if (orientation?.lock) {
        await orientation.lock("landscape");
      }
    } else {
      await document.exitFullscreen();

      const orientation = (screen as any).orientation;
      if (orientation?.unlock) {
        orientation.unlock();
      }
    }
  } catch (err) {
    console.log("Fullscreen/Rotation error:", err);
  }
};

  // const toggleFullScreen = async () => {
  //   const container = videoRef.current?.parentElement;
  //   if (!container) return;

  //   if (!document.fullscreenElement) {
  //     await container.requestFullscreen();
  //   } else {
  //     await document.exitFullscreen();
  //   }
  // };

  const handleTimeUpdate = () => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 200) return;
    lastUpdateRef.current = now;

    if (seeking) return;
    const v = videoRef.current;
    if (!v || !v.duration) return;

    setProgress((v.currentTime / v.duration) * 100);
    setCurrentTime(v.currentTime);
    setDuration(v.duration);
  };

  const handleTimelineClick = (e: any) => {
    const v = videoRef.current;
    if (!v) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    v.currentTime = (clickX / rect.width) * v.duration;
  };

  const handleSeekStart = () => setSeeking(true);

  const handleSeekMove = (e: any) => {
    if (!seeking) return;
    const v = videoRef.current;
    if (!v) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let pos = (e.clientX - rect.left) / rect.width;
    pos = Math.max(0, Math.min(pos, 1));

    v.currentTime = v.duration * pos;
    setProgress(pos * 100);
  };

  const handleSeekEnd = () => setSeeking(false);

  const handleProgress = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;

    if (v.buffered.length > 0) {
      const end = v.buffered.end(v.buffered.length - 1);
      setBuffered((end / v.duration) * 100);
    }
  };

  const handleVolumeChange = (e: any) => {
    const v = videoRef.current;
    if (!v) return;

    const vol = Number(e.target.value);

    if (vol > 0) lastVolumeRef.current = vol;

    v.volume = vol;
    v.muted = vol === 0;

    setVolume(vol);
    setMuted(v.muted);
  };

  let hideTimeout: any;

  const showUI = () => {
    setShowControls(true);
    clearTimeout(hideTimeout);

    hideTimeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2000);
  };

  const sendView = async () => {
    if (!watchStartRef.current) return;

    const watchTime = Math.floor((Date.now() - watchStartRef.current) / 1000);

    if (watchTime < 3) return;

    try {
      await postView({
        videoId,
        sessionId: sessionIdRef.current,
        watchTime,
      });
    } catch (err) {
      console.log("Failed to post view", err);
    }
  };

  useEffect(() => {
    let sid = sessionStorage.getItem("video_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("video_session_id", sid);
    }
    sessionIdRef.current = sid;
  }, []);

  useEffect(() => {
    watchStartRef.current = Date.now();

    return () => {
      sendView();
    };
  }, [src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") togglePlay();
      if (e.code === "ArrowRight") videoRef.current!.currentTime += 5;
      if (e.code === "ArrowLeft") videoRef.current!.currentTime -= 5;
      if (e.code === "KeyM") toggleMute();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`video-${videoId}`);
    if (saved) videoRef.current!.currentTime = Number(saved);
  }, [videoId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current)
        localStorage.setItem(
          `video-${videoId}`,
          String(videoRef.current.currentTime),
        );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

 
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // If HLS stream
    if (src.endsWith(".m3u8")) {
      // 🔥 ALWAYS use HLS.js (even if Safari)
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          console.log("HLS Levels:", data.levels);
          setQualities(data.levels);
        });

        setHlsInstance(hls);

        return () => {
          hls.destroy();
        };
      }

      // fallback only if HLS.js not supported
      video.src = src;
    } else {
      video.src = src;
    }
  }, [src]);

  const changeQuality = (levelIndex: number) => {
    if (!hlsInstance) return;

    hlsInstance.currentLevel = levelIndex;
    setSelectedQuality(levelIndex);
  };

  // console.log("VIDEO SRC:", src);

  return (
    <div className={styles.playerWrapper}>
      {loading && <div className={styles.loader} />}

      <div className={styles.inner} onClick={togglePlay} onMouseMove={showUI}>
        <video
          ref={videoRef}
          // src={src}
          autoPlay
          playsInline
          preload="metadata"
          // poster="/thumb.jpg"
          className={styles.video}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onProgress={handleProgress}
        />
        {!isPlaying && !loading && (
          <div
            className={styles.centerPlay}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <span className="material-symbols-outlined">play_arrow</span>
          </div>
        )}

        <div
          className={`${styles.overlay} ${showControls ? styles.visible : ""}`}
        >
          <div className={styles.controls} onClick={(e) => e.stopPropagation()}>
            {/* <span className="material-symbols-outlined" onClick={toggleMute}>
              {muted ? "volume_off" : "volume_up"}
            </span> */}
            <div
              className={styles.timeline}
              onClick={handleTimelineClick}
              onMouseDown={handleSeekStart}
              onMouseMove={handleSeekMove}
              onMouseUp={handleSeekEnd}
              onMouseLeave={handleSeekEnd}
            >
              <div
                className={styles.progress}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className={styles.bottomControls}>
            <div className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className={styles.volumeGroup}>
              <span
                className="material-symbols-outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
              >
                {muted ? "volume_off" : "volume_up"}
              </span>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onClick={(e) => e.stopPropagation()}
                onChange={handleVolumeChange}
                className={styles.volumeSliderInline}
              />
           {qualities.length > 0 && (
  <div
    className={styles.qualityContainer}
    onClick={(e) => e.stopPropagation()}
  >
    <button
      className={styles.qualityButton}
      onClick={() => setShowQuality((prev) => !prev)}
    >
      {selectedQuality === -1
        ? "Auto"
        : `${qualities[selectedQuality]?.height}p`}
    </button>

    {showQuality && (
      <div className={styles.qualityMenu}>
        <div
          className={`${styles.qualityItem} ${
            selectedQuality === -1 ? styles.active : ""
          }`}
          onClick={() => {
            changeQuality(-1);
            setShowQuality(false);
          }}
        >
          Auto
          {selectedQuality === -1 && <span>✓</span>}
        </div>

        {qualities.map((level, index) => (
          <div
            key={index}
            className={`${styles.qualityItem} ${
              selectedQuality === index ? styles.active : ""
            }`}
            onClick={() => {
              changeQuality(index);
              setShowQuality(false);
            }}
          >
            {level.height}p
            {selectedQuality === index && <span>✓</span>}
          </div>
        ))}
      </div>
    )}
  </div>
)}
              <span
                className="material-symbols-outlined"
                onClick={toggleFullScreen}
              >
                fullscreen
              </span>
            </div>
             
          </div>
        </div>
      </div>
    </div>
  );
}
