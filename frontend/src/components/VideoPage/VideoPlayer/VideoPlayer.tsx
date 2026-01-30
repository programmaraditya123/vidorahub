"use client";

import { useRef, useState, useEffect } from "react";
import styles from "./VideoPlayer.module.scss";
import { postView } from "@/src/lib/video/videodata";

interface Props {
  src: string;
  videoId: string;
}

export default function VideoPlayer({ src, videoId }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

 const lastUpdateRef = useRef(0);


  // ⏱ track watch start
  const watchStartRef = useRef<number | null>(null);

  // 🆔 session id
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    let sid = sessionStorage.getItem("video_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("video_session_id", sid);
    }
    sessionIdRef.current = sid;
  }, []);

  // ▶️ start timer when src changes (new video)
  useEffect(() => {
    watchStartRef.current = Date.now();

    return () => {
      sendView(); // 🔥 send when src changes or page changes
    };
  }, [src]);

  const sendView = async () => {
    if (!watchStartRef.current) return;

    const watchTime = Math.floor(
      (Date.now() - watchStartRef.current) / 1000
    );

    if (watchTime < 3) return; // ignore very short views

    try {
      await postView({
        videoId,
        sessionId: sessionIdRef.current,
        watchTime
      });
    } catch (err) {
      console.error("Failed to post view", err);
    }
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


const handleTimeUpdate = () => {
  const now = Date.now();
  if (now - lastUpdateRef.current < 200) return; // 5fps max
  lastUpdateRef.current = now;

  if (seeking) return;
  const v = videoRef.current;
  if (!v || !v.duration) return;

  setProgress((v.currentTime / v.duration) * 100);
};


  const handleTimelineClick = (e: any) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = (clickX / rect.width) * v.duration;
    v.currentTime = time;
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

  const handleVolumeChange = (e: any) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = Number(e.target.value);
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(vol);
  };

  const toggleFullScreen = () => {
    const container = videoRef.current?.parentElement!;
    if (!document.fullscreenElement) container.requestFullscreen();
    else document.exitFullscreen();
  };

  const toggleMute = () => {
  const v = videoRef.current;
  if (!v) return;
  v.muted = !v.muted;
  setMuted(v.muted);
};


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
  const handleUnload = () => sendView();

  window.addEventListener("beforeunload", handleUnload);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) sendView();
  });

  return () => {
    window.removeEventListener("beforeunload", handleUnload);
  };
}, []);


  return (
    <div className={styles.playerWrapper}>
      <div className={styles.inner} onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          preload="metadata"
          poster="/thumb.jpg"
          onTimeUpdate={handleTimeUpdate}
          className={styles.video}
        />


        <div className={styles.overlay}>
          <div className={styles.controls}>
            <span
  className="material-symbols-outlined"
  onClick={toggleMute}
>
  {muted ? "volume_off" : "volume_up"}
</span>


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

            <div className={styles.volumeWrapper}>
              <span
                className="material-symbols-outlined"
                onClick={() =>
                  (videoRef.current!.muted = !videoRef.current!.muted)
                }
              >
                {videoRef.current?.muted ? "volume_off" : "volume_up"}
              </span>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
              />
            </div>

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
  );
}
