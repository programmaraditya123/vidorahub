"use client";

import styles from "./VideoDiscription.module.scss";

interface Props {
  views: string;
  uploaded: string;
  hashtags: string[];
  description: string;
}

export default function VideoDescription({
  views,
  uploaded,
  hashtags,
  description,
}: Props) {
  return (
    <div className={`${styles.wrapper} glass-dark`}>
      {/* TOP ROW */}
      <div className={styles.headerRow}>
        <h3 className={`${styles.sectionLabel} neon-glow`}>
          Description
        </h3>

        <div className={styles.stats}>
          <span>{views} views</span>
          <span>•</span>
          <span>{uploaded}</span>
        </div>
      </div>

      {/* HASHTAGS */}
      <div className={styles.tags}>
        {hashtags.map((tag) => (
          <span key={tag} className={styles.tag}>
            #{tag}
          </span>
        ))}
      </div>

      {/* TEXT */}
      <p className={styles.text}>
        {description}
      </p>

      {/* READ MORE */}
      <button className={styles.readMore}>
        READ MORE
        <span className="material-symbols-outlined">keyboard_arrow_down</span>
      </button>

      {/* ACTION BAR */}
      <div className={styles.actions}>
        <button className={styles.likeBtn}>
          <span className="material-symbols-outlined">thumb_up</span>
          42K
        </button>

        <button className={styles.dislikeBtn}>
          <span className="material-symbols-outlined">thumb_down</span>
        </button>

        <button className={styles.shareBtn}>
          <span className="material-symbols-outlined">share</span>
          Share
        </button>
      </div>
    </div>
  );
}
