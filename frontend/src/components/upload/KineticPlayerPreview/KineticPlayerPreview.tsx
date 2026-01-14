"use client";

import { useRef, useState } from "react";
import styles from "./KineticPlayerPreview.module.scss";

interface Props {
  src: string | null;
}

export default function KineticPlayerPreview({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [totalTime, setTotalTime] = useState("--:--");
  const [progress, setProgress] = useState(0);

  // FORMAT
  const format = (sec: number) => {
    if (!sec) return "00:00";
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // LOAD
  const handleLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setTotalTime(format(v.duration));
  };

  // UPDATE TIME
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(format(v.currentTime));
    setProgress((v.currentTime / v.duration) * 100);
  };

  // SEEK
  const handleSeek = (e: any) => {
    const v = videoRef.current;
    if (!v) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;

    v.currentTime = v.duration * pos;
  };

  // PLAY/PAUSE toggle
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  };

  // FULLSCREEN
  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement?.parentElement;

    if (!document.fullscreenElement) {
      container?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // VOLUME
  const handleVolume = (e: any) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Number(e.target.value);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.glowOutline}></div>

      <div className={styles.glassFrame}>
        <div className={styles.videoContainer}>
          {/* CENTER PLAY ICON - CLICK WORKS NOW */}
          {!isPlaying && (
            <div className={styles.centerPlayPause} onClick={togglePlay}>
              <span className="material-symbols-outlined">play_arrow</span>
            </div>
          )}

          {src ? (
            <video
              ref={videoRef}
              src={src}
              autoPlay
              onLoadedMetadata={handleLoaded}
              onTimeUpdate={handleTimeUpdate}
              className={styles.video}
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <div className={styles.placeholder}></div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className={styles.bottomOverlay}>
          <div className={styles.progressWrapper}>
            <div className={styles.progressTrack} onClick={handleSeek}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              >
                <div className={styles.progressBall}></div>
              </div>
            </div>

            <div className={styles.timeRow}>
              <p>
                {currentTime} / {totalTime}
              </p>

              <div className={styles.controls}>
                <span className="material-symbols-outlined" onClick={togglePlay}>
                  {isPlaying ? "pause" : "play_arrow"}
                </span>

                <div className={styles.inlineVol}>
                  <span className="material-symbols-outlined">volume_up</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    defaultValue={1}
                    onChange={handleVolume}
                    className={styles.volumeSliderInline}
                  />
                </div>

                <span
                  className="material-symbols-outlined"
                  onClick={toggleFullscreen}
                >
                  fullscreen
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
