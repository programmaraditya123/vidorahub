"use client";

import styles from "./VisualCarousel.module.scss";

interface FrameItem {
  id: string;
  src: string;
  isCurrent?: boolean;
}

interface Props {
  frames: FrameItem[];
  onSelect?: (id: string) => void;
}

export default function VisualCarousel({ frames, onSelect }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Visual Carousel</h3>
        <span>AI Suggestions Ready</span>
      </div>

      <div className={styles.scroller}>
        {/* Render Frames */}
        {frames.map((frame) => (
          <div
            key={frame.id}
            className={`${styles.frame} ${
              frame.isCurrent ? styles.current : ""
            }`}
            onClick={() => onSelect?.(frame.id)}
          >
            <img src={frame.src} alt="frame" />

            {frame.isCurrent && (
              <div className={styles.currentTag}>CURRENT</div>
            )}
          </div>
        ))}

        {/* Add Custom Frame */}
        <div className={styles.addCustom}>
          <span className="material-symbols-outlined">add_photo_alternate</span>
          <p>Custom</p>
        </div>
      </div>
    </div>
  );
}
