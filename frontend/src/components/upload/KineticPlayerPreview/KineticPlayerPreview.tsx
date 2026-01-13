"use client";

import styles from "./KineticPlayerPreview.module.scss";

interface Props {
  src: string | null;
}

export default function KineticPlayerPreview({ src }: Props) {
  return (
    <div className={styles.wrapper}>
      {/* Glow outline */}
      <div className={styles.glowOutline}></div>

      {/* Glass container */}
      <div className={styles.glassFrame}>

        {/* Video inside */}
        <div className={styles.videoContainer}>
          {src ? (
            <video
              src={src}
              controls
              autoPlay
              className={styles.video}
            />
          ) : (
            <div className={styles.placeholder}></div>
          )}
        </div>

        {/* Gradient bottom overlay */}
        <div className={styles.bottomOverlay}>
          {/* Progress bar */}
          <div className={styles.progressWrapper}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill}>
                <div className={styles.progressBall}></div>
              </div>
            </div>
            <div className={styles.timeRow}>
              <p>00:00 / --:--</p>

              <div className={styles.controls}>
                <span className="material-symbols-outlined">volume_up</span>
                <span className="material-symbols-outlined">settings</span>
                <span className="material-symbols-outlined">fullscreen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
