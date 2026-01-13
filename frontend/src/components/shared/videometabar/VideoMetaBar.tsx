"use client";

import styles from "./VideoMetaBar.module.scss";
import Image from "next/image";

interface Props {
  title: string;
  channelName: string;
  channelImage: string;
  subscribers: string;
}

export default function VideoMetaBar({
  title,
  channelName,
  channelImage,
  subscribers,
}: Props) {
  return (
    <div className={styles.wrapper}>
      {/* CATEGORY / TAG */}
      <div className={styles.topRow}>
        <span className={`${styles.tag} neon-glow glass-dark`}>
          Featured
        </span>
      </div>

      {/* TITLE */}
      <h1 className={styles.title}>
        {title}
      </h1>

      {/* CHANNEL ROW */}
      <div className={styles.channelRow}>
        <Image
          src={channelImage}
          alt={channelName}
          width={54}
          height={54}
          className={styles.avatar}
        />

        <div className={styles.channelInfo}>
          <h3 className={styles.channelName}>{channelName}</h3>
          <p className={styles.subscribers}>
            {subscribers} Subscribers
          </p>
        </div>

        <button className={styles.subscribeBtn}>
          Subscribe
        </button>
      </div>
    </div>
  );
}
