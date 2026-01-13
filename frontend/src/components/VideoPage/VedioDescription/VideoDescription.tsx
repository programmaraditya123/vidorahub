"use client";

import { useState } from "react";
import styles from "./VideoDescription.module.scss";

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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.header}>Resources & Info</h2>

      <div className={styles.descriptionBox}>
        <p className={`${styles.text} ${expanded ? styles.open : ""}`}>
          {description}
        </p>

        <button
          className={styles.readMore}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "SHOW LESS" : "READ MORE"}
          <span className="material-symbols-outlined">
            {expanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
          </span>
        </button>
      </div>
    </div>
  );
}
