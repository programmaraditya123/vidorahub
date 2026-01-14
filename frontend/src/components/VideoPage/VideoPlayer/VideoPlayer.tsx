"use client";

import { useRef, useState, useEffect } from "react";
import styles from "./VideoPlayer.module.scss";

interface Props {
  src: string;
}

export default function VideoPlayer({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [volume, setVolume] = useState(1);

  /* ------------------------
        PLAY / PAUSE
  ------------------------- */
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  /* ------------------------
        TIMELINE PROGRESS
  ------------------------- */
  const handleTimeUpdate = () => {
    if (seeking) return; // don't update while dragging

    const v = videoRef.current;
    if (!v) return;

    setProgress((v.currentTime / v.duration) * 100);
  };

  /* ------------------------
      CLICK TO SEEK
  ------------------------- */
  const handleTimelineClick = (e: any) => {
    const v = videoRef.current;
    if (!v) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = (clickX / rect.width) * v.duration;

    v.currentTime = time;
  };

  /* ------------------------
      DRAG TO SEEK (SCRUB)
  ------------------------- */
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

  /* ------------------------
          VOLUME
  ------------------------- */
  const handleVolumeChange = (e: any) => {
    const v = videoRef.current;
    if (!v) return;

    const vol = Number(e.target.value);
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(vol);
  };

  /* ------------------------
        FULLSCREEN
  ------------------------- */
  const toggleFullScreen = () => {
    const container = videoRef.current?.parentElement!;
    if (!document.fullscreenElement) container.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div className={styles.playerWrapper}>
      <div className={styles.inner} onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          className={styles.video}
        />

        <div className={styles.overlay}>
          <div className={styles.controls}>

            {/* PLAY / PAUSE */}
            <span className="material-symbols-outlined" onClick={togglePlay}>
              {isPlaying ? "pause" : "play_arrow"}
            </span>

            {/* TIMELINE + DRAG SEEK */}
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

            {/* VOLUME TOOLTIP */}
            <div className={styles.volumeWrapper}>
              <span
                className="material-symbols-outlined"
                onClick={() => (videoRef.current!.muted = !videoRef.current!.muted)}
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

            {/* FULLSCREEN */}
            <span className="material-symbols-outlined" onClick={toggleFullScreen}>
              fullscreen
            </span>

          </div>
        </div>
      </div>
    </div>
  );
}







// "use client";

// import styles from "./VideoPlayer.module.scss";

// interface Props {
//   src: string;
// }

// export default function VideoPlayer({ src }: Props) {
//   return (
//     <div className={`${styles.playerWrapper} playerGlow glass`}>
//       <div className={styles.inner}>
//         <video
//           src={src}
//           autoPlay
//           className={styles.video}
//         ></video>

//         {/* HOVER OVERLAY */}
//         <div className={styles.overlay}>
//           <div className={styles.controls}>
//             <span className="material-symbols-outlined">play_arrow</span>

//             <div className={styles.timeline}>
//               <div className={styles.progress}></div>
//             </div>

//             <span className="material-symbols-outlined">volume_up</span>
//             <span className="material-symbols-outlined">fullscreen</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
