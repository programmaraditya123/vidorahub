"use client";

import styles from "./VideoMeta.module.scss";

interface Props {
  title: string;
  category: string;
  published: string;
  uploader : {
    _id : string,
    name : string,
    subscriber : number
  }
}

export default function VideoMeta({ title, category, published , uploader}: Props) {
  return (
    <div className={styles.meta}>
      {/* CATEGORY + PUBLISHED */}
      <div className={styles.top}>
        <span className={`${styles.category} neon-glow`}>{category}</span>
        <span className={styles.published}>Published {published}</span>
      </div>

      {/* TITLE */}
      <h1 className={styles.title}>
        {title} <span className={styles.hash}>#024</span>
      </h1>

      {/* CHANNEL ROW */}
      <div className={styles.channelRow}>
        <div
          className={styles.avatar}
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB7l0EWz1hBqpdjmRYNzy7ggwUEvmYk-4CzCpwX1RSEZR8jc5B2W85SNXX4A5yW5V64bw9Vrutfyll7spm4H1iifX1_buEQ6Dc-tB9WNCHMp9hT17YJXhYu8PJY2Aw1wuE2PX3X66HMl60gdC1e6cYdJz2FgUNF6WrZuUIjsDPjJpLNQ-IHg1F3-wgqJLi045QB5I4Lal9SOmRyArMS7pWAgcupMFgFaJMW8S3MvJf7BHVncFqhXoPYf2k9ViJsFga5QDJikEIQf8U1')",
          }}
        ></div>

        <div className={styles.channelInfo} key={uploader._id}>
          <h3>{uploader.name}</h3>
          <p>{uploader.subscriber}</p>
        </div>

        <button className={styles.subscribe}>Subscribe</button>
      </div>
    </div>
  );
}
