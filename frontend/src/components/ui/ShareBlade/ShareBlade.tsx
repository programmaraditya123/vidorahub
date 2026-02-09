"use client";

import { useEffect, useState } from "react";
import styles from "./ShareBlade.module.scss";

interface Props {
  thumbnailUrl: string;
  link: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareBlade({
  thumbnailUrl,
  link,
  isOpen,
  onClose,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      setTimeout(() => setVisible(false), 300);
    }
  }, [isOpen]);

  if (!visible) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const encoded = encodeURIComponent(link);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encoded}`,
    telegram: `https://t.me/share/url?url=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?url=${encoded}`,
  };

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ""}`} onClick={onClose}>
      <div className={`${styles.modal} ${isOpen ? styles.open : ""}`}>
        <button className={styles.close} onClick={onClose}>
          ✕
        </button>

        {/* PREVIEW */}
        <div className={styles.preview}>
          {/* blur placeholder */}
          <img
            src={thumbnailUrl}
            className={`${styles.thumbnail} ${styles.blur}`}
          />

          {/* main image */}
          <img
            src={thumbnailUrl}
            onLoad={() => setLoaded(true)}
            className={`${styles.thumbnail} ${
              loaded ? styles.loaded : styles.hidden
            }`}
          />

          <div className={styles.gradient} />
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          <label className={styles.label}>Direct Link</label>

          <div className={styles.copyRow}>
            <input value={link} readOnly className={styles.input} />

            <button
              onClick={copyLink}
              className={`${styles.copyBtn} ${
                copied ? styles.success : ""
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className={styles.socialGrid}>
            {/* X */}
            <a href={shareLinks.twitter} target="_blank">
              <svg viewBox="0 0 24 24" width="22">
                <path
                  fill="white"
                  d="M18.244 2.25h3.308l-7.227 8.26L22.827 21.75H16.17
                     l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254
                     2.25H8.08l4.713 6.231zm-1.161
                     17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
            </a>

            {/* TELEGRAM */}
            <a href={shareLinks.telegram} target="_blank">
              <svg viewBox="0 0 24 24" width="22">
                <path
                  fill="white"
                  d="M9.04 15.47l-.39 5.48c.56 0 .8-.24 1.08-.52l2.6-2.49
                  5.39 3.94c.99.55 1.69.26 1.94-.91l3.52-16.47.001-.001
                  c.29-1.36-.49-1.89-1.46-1.53L1.59 9.55c-1.34.52-1.32
                  1.27-.23 1.61l5.7 1.78L19.47 6.6c.58-.38 1.11-.17.67.21"
                />
              </svg>
            </a>

            {/* WHATSAPP */}
            <a href={shareLinks.whatsapp} target="_blank">
              <svg viewBox="0 0 24 24" width="22">
                <path
                  fill="white"
                  d="M20.52 3.48A11.78 11.78 0 0012.06 0C5.49
                  0 .12 5.36.12 11.93c0 2.1.55 4.15 1.6
                  5.95L0 24l6.27-1.64a11.9 11.9 0 005.8
                  1.48h.01c6.57 0 11.94-5.36
                  11.94-11.93 0-3.18-1.24-6.17-3.5-8.43z"
                />
              </svg>
            </a>

            {/* Native Share */}
            <button onClick={() => navigator.share?.({ url: link })}>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
