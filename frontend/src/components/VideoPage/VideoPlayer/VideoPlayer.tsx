"use client";

import styles from "./VideoPlayer.module.scss";

interface Props {
  src: string;
}

export default function VideoPlayer({ src }: Props) {
  return (
    <div className={`${styles.playerWrapper} playerGlow glass`}>
      <div className={styles.inner}>
        <video
          src={src}
          controls
          autoPlay
          className={styles.video}
        ></video>

        {/* HOVER OVERLAY */}
        <div className={styles.overlay}>
          <div className={styles.controls}>
            <span className="material-symbols-outlined">play_arrow</span>

            <div className={styles.timeline}>
              <div className={styles.progress}></div>
            </div>

            <span className="material-symbols-outlined">volume_up</span>
            <span className="material-symbols-outlined">fullscreen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
