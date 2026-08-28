"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./VideoPlayer.module.scss";
import { postView } from "@/src/lib/video/videodata";
import {
  getVideoProgress,
  sendVideoProgress,
  type VideoProgressRecord,
} from "@/src/lib/video/videoprogress";
import Hls from "hls.js";

interface Props {
  src: string;
  videoId: string;
}

const isObjectId = (value?: string) => /^[a-f\d]{24}$/i.test(value || "");

const getClientPlatform = (): "android" | "web" | "apple" => {
  if (typeof navigator === "undefined") return "web";
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("android")) return "android";
  if (/iphone|ipad|ipod|macintosh/.test(userAgent)) return "apple";

  return "web";
};

const createClientId = (prefix: string) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

export default function VideoPlayer({ src, videoId }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastUpdateRef = useRef(0);
  const watchStartRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>("");
  const hlsRef = useRef<Hls | null>(null);
  const progressProfileIdRef = useRef<string>("");
  const restoredProgressRef = useRef(false);
  const lastProgressSyncAtRef = useRef(0);
  const progressSyncInFlightRef = useRef(false);
  const savedTimeRef = useRef<number>(0); 

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
  const [qualities, setQualities] = useState<any[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [showQuality, setShowQuality] = useState(false);
  const [thumbnail, setThumbnail] = useState("");

  const lastVolumeRef = useRef(1);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getLocalProgressKey = useCallback(() => `video-${videoId}`, [videoId]);

  const getStoredProfileId = useCallback(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("activeProfileId") || "";
  }, []);

  const getStoredDeviceId = useCallback(() => {
    if (typeof window === "undefined") return "";

    const key = "vidorahub_device_id";
    let deviceId = localStorage.getItem(key);

    if (!deviceId) {
      deviceId = createClientId("device");
      localStorage.setItem(key, deviceId);
    }

    return deviceId;
  }, []);

  const getFallbackProgress = useCallback(() => {
    if (typeof window === "undefined" || !videoId) return 0;
    const saved = localStorage.getItem(getLocalProgressKey());
    const parsed = Number(saved);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [getLocalProgressKey, videoId]);

  const getResumePosition = useCallback(
    (progressData?: VideoProgressRecord | null) => {
      if (progressData?.isCompleted) return 0;
      const remotePosition = Number(progressData?.position);

      if (Number.isFinite(remotePosition) && remotePosition > 0) {
        return remotePosition;
      }

      return getFallbackProgress();
    },
    [getFallbackProgress],
  );

  const applyResumePosition = useCallback((position: number, force = false) => {
    const video = videoRef.current;
    if (!video || position < 0 || (!force && restoredProgressRef.current)) return;

    const safePosition =
      video.duration && Number.isFinite(video.duration)
        ? Math.min(position, Math.max(0, video.duration - 2))
        : position;

    if (force || safePosition > 0) {
      video.currentTime = safePosition;
      savedTimeRef.current = safePosition;
      restoredProgressRef.current = true;
    }
  }, []);

  const savePlaybackProgress = useCallback(async (force = false) => {
    const video = videoRef.current;
    if (!video || !videoId || !Number.isFinite(video.currentTime)) return;

    const now = Date.now();

    if (!force && now - lastProgressSyncAtRef.current < 7000) return;
    if (progressSyncInFlightRef.current) return;

    const position = Math.max(0, video.currentTime);
    const safeDuration =
      video.duration && Number.isFinite(video.duration) ? video.duration : null;

    localStorage.setItem(getLocalProgressKey(), String(position));

    const profileId = progressProfileIdRef.current || getStoredProfileId();
    progressProfileIdRef.current = profileId;

    if (
      !isObjectId(profileId) ||
      !isObjectId(videoId) ||
      !localStorage.getItem("token")
    ) {
      lastProgressSyncAtRef.current = now;
      return;
    }

    try {
      progressSyncInFlightRef.current = true;
      await sendVideoProgress({
        profileId,
        videoId,
        position,
        duration: safeDuration,
        clientProgressAt: now,
        playbackSpeed: video.playbackRate,
        muted: video.muted,
      });
      lastProgressSyncAtRef.current = now;
    } catch (err) {
      console.log("Failed to save video progress", err);
    } finally {
      progressSyncInFlightRef.current = false;
    }
  }, [getLocalProgressKey, getStoredProfileId, videoId]);

  
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      watchStartRef.current = Date.now();
    } else {
      v.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
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
  }, []);

  
  const toggleFullScreen = useCallback(async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        await (screen as any).orientation?.lock?.("landscape").catch(() => {});
      } else {
        await document.exitFullscreen();
        (screen as any).orientation?.unlock?.();
      }
    } catch (err) {
      console.log("Fullscreen error:", err);
    }
  }, []);

  
  const handleTimeUpdate = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 200) return;
    lastUpdateRef.current = now;
    if (seeking) return;
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const ct = v.currentTime;
    setProgress((ct / v.duration) * 100);
    setCurrentTime(ct);
    setDuration(v.duration);
    savedTimeRef.current = ct; 
  }, [seeking]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  const handleSeekStart = useCallback(() => setSeeking(true), []);

  const handleSeekMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!seeking) return;
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    v.currentTime = v.duration * pos;
    setProgress(pos * 100);
  }, [seeking]);

  const handleSeekEnd = useCallback(() => setSeeking(false), []);

  const handleProgress = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration || !v.buffered.length) return;
    setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = Number(e.target.value);
    if (vol > 0) lastVolumeRef.current = vol;
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(vol);
    setMuted(v.muted);
  }, []);

  
  const showUI = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 2500);
  }, []);

  
  const sendView = useCallback(async () => {
    if (!watchStartRef.current) return;
    const watchTime = Math.floor((Date.now() - watchStartRef.current) / 1000);
    if (watchTime < 3) return;

    const profileId = getStoredProfileId();
    const deviceId = getStoredDeviceId();

    if (
      !localStorage.getItem("token") ||
      !isObjectId(profileId) ||
      !isObjectId(videoId) ||
      !sessionIdRef.current ||
      !deviceId
    ) {
      return;
    }

    try {
      await postView({
        profileId,
        videoId,
        sessionId: sessionIdRef.current,
        deviceId,
        watchTime,
        platform: getClientPlatform(),
      });
    } catch (err) {
      console.log("Failed to post view", err);
    }
  }, [getStoredDeviceId, getStoredProfileId, videoId]);

  
  const changeQuality = useCallback((levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    
    savedTimeRef.current = videoRef.current?.currentTime ?? savedTimeRef.current;
    hls.currentLevel = levelIndex;
    setSelectedQuality(levelIndex);
    setShowQuality(false);
  }, []);

  
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    restoredProgressRef.current = false;
    lastProgressSyncAtRef.current = 0;
    progressSyncInFlightRef.current = false;

    let progressCancelled = false;
    let resumePosition = getFallbackProgress();

    const loadRemoteProgress = async () => {
      const profileId = getStoredProfileId();
      progressProfileIdRef.current = profileId;

      if (
        !isObjectId(profileId) ||
        !isObjectId(videoId) ||
        !localStorage.getItem("token")
      ) {
        return;
      }

      try {
        const response = await getVideoProgress(profileId, videoId);
        if (progressCancelled) return;

        resumePosition = getResumePosition(response.data);
        applyResumePosition(resumePosition, true);
      } catch (err) {
        console.log("Failed to fetch video progress", err);
      }
    };

    loadRemoteProgress();

    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (src.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          
          startLevel: -1,
          abrEwmaDefaultEstimate: 500000,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setQualities(data.levels);
          
          if (video.currentTime < 1) applyResumePosition(resumePosition);
        });

        
        hls.on(Hls.Events.LEVEL_SWITCHED, () => {
          if (video && savedTimeRef.current > 0) {
            video.currentTime = savedTimeRef.current;
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        
        video.src = src;
        video.addEventListener(
          "loadedmetadata",
          () => {
            applyResumePosition(resumePosition);
          },
          { once: true },
        );
      }
    } else {
      video.src = src;
      video.addEventListener(
        "loadedmetadata",
        () => {
          applyResumePosition(resumePosition);
        },
        { once: true },
      );
    }

    watchStartRef.current = Date.now();

    return () => {
      progressCancelled = true;
      void savePlaybackProgress(true);
      sendView();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [
    applyResumePosition,
    getFallbackProgress,
    getResumePosition,
    getStoredProfileId,
    savePlaybackProgress,
    src,
    videoId,
  ]);

  
  useEffect(() => {
    let sid = sessionStorage.getItem("video_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("video_session_id", sid);
    }
    sessionIdRef.current = sid;
  }, []);

  
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
      
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight") videoRef.current && (videoRef.current.currentTime += 5);
      if (e.code === "ArrowLeft")  videoRef.current && (videoRef.current.currentTime -= 5);
      if (e.code === "KeyM") toggleMute();
      if (e.code === "KeyF") toggleFullScreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleMute, toggleFullScreen]);

  
  useEffect(() => {
    const interval = setInterval(() => {
      void savePlaybackProgress();
    }, 7000);

    const handlePageHide = () => {
      void savePlaybackProgress(true);
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [savePlaybackProgress]);

  
  useEffect(() => {
    const url = localStorage.getItem("thubnailUrl");
    if (url) setThumbnail(url);
  }, []);

  
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <div className={styles.playerWrapper}>
      <div className={styles.inner} onClick={togglePlay} onMouseMove={showUI}>

        
        {loading && <div className={styles.loader} />}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          preload="metadata"
          poster={thumbnail}
          className={styles.video}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onProgress={handleProgress}
        />

        {!isPlaying && !loading && (
          <div
            className={styles.centerPlay}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          >
            <span className="material-symbols-outlined">play_arrow</span>
          </div>
        )}

        <div className={`${styles.overlay} ${showControls ? styles.visible : ""}`}>
          
          <div className={styles.controls} onClick={(e) => e.stopPropagation()}>
            <div
              className={styles.timeline}
              onClick={handleTimelineClick}
              onMouseDown={handleSeekStart}
              onMouseMove={handleSeekMove}
              onMouseUp={handleSeekEnd}
              onMouseLeave={handleSeekEnd}
            >
              <div className={styles.buffer} style={{ width: `${buffered}%` }} />
              <div className={styles.progress} style={{ width: `${progress}%` }} />
            </div>
          </div>

          
          <div className={styles.bottomControls}>
            <div className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className={styles.volumeGroup}>
              <span
                className="material-symbols-outlined"
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
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
                        className={`${styles.qualityItem} ${selectedQuality === -1 ? styles.active : ""}`}
                        onClick={() => changeQuality(-1)}
                      >
                        Auto {selectedQuality === -1 && <span>✓</span>}
                      </div>
                      {qualities.map((level, index) => (
                        <div
                          key={index}
                          className={`${styles.qualityItem} ${selectedQuality === index ? styles.active : ""}`}
                          onClick={() => changeQuality(index)}
                        >
                          {level.height}p {selectedQuality === index && <span>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <span
                className="material-symbols-outlined"
                onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }}
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















  













































































































































































































































































 






















































































































































































             



