"use client";

import { useRef } from "react";
import styles from "./VisualCarousel.module.scss";

interface FrameItem {
  id: string;
  src: string;
  isCurrent?: boolean;
}

interface Props {
  frames: FrameItem[];
  onSelect?: (id: string, customSrc?: string) => void;
  onDelete?: (id: string) => void;   // 👈 NEW
}

export default function VisualCarousel({ frames, onSelect, onDelete }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCustomUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const newId = "custom-" + Date.now();
      onSelect?.(newId, src);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Visual Carousel</h3>
        <span>AI Suggestions Ready</span>
      </div>

      <div className={styles.scroller}>
        {frames.map((frame) => (
          <div
            key={frame.id}
            className={`${styles.frame} ${
              frame.isCurrent ? styles.current : ""
            }`}
          >
            {/* Image */}
            <img
              src={frame.src}
              alt="frame"
              onClick={() => onSelect?.(frame.id)}
            />

            {/* CURRENT TAG */}
            {frame.isCurrent && <div className={styles.currentTag}>CURRENT</div>}

            {/* Delete Button */}
            <button
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation(); // prevent selecting
                onDelete?.(frame.id);
              }}
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        ))}

        {/* Custom Upload Card */}
        <div className={styles.addCustom} onClick={handleCustomUpload}>
          <span className="material-symbols-outlined">add_photo_alternate</span>
          <p>Custom</p>
        </div>

        {/* Hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
