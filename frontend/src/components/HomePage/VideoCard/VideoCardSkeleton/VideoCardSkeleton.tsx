"use client";

import styles from "./VideoCardSkeleton.module.scss";

export default function VideoCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        <div className={styles.thumbnail} />
      </div>

      <div className={styles.info}>
        <div className={styles.avatar} />
        <div className={styles.meta}>
          <div className={styles.title} />
          <div className={styles.creator} />
          <div className={styles.views} />
        </div>
      </div>
    </div>
  );
}
