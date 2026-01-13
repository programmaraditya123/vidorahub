"use client";

import styles from "./VideoActions.module.scss";

interface Props {
  likes: string;
}

export default function VideoActions({ likes }: Props) {
  return (
    <div className={styles.actionsWrapper}>
      {/* LIKE + DISLIKE */}
      <div className={styles.likeBar}>
        <button className={styles.likeBtn}>
          <span className="material-symbols-outlined">thumb_up</span>
          <span className={styles.likeCount}>{likes}</span>
        </button>

        <div className={styles.divider}></div>

        <button className={styles.dislikeBtn}>
          <span className="material-symbols-outlined">thumb_down</span>
        </button>
      </div>

      {/* SHARE BUTTON */}
      <button className={styles.shareBtn}>
        <span className="material-symbols-outlined">share</span>
        <span>Share</span>
      </button>
    </div>
  );
}
