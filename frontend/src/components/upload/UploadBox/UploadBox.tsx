"use client";

import React, { useRef, useState, useCallback } from "react";
import styles from "./UploadBox.module.scss";
// import { ALLOWED_VIDEO_TYPES, MAX_SIZE_MB } from "./uploadValidation";
const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
    "video/x-msvideo"
]
 

const MAX_SIZE_MB = 1024;

type Props = {
  onFileReady: (file: File) => void;
};

export default function UploadBox({ onFileReady }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (f: File) => {
    if (!ALLOWED_VIDEO_TYPES.includes(f.type)) {
      return "Unsupported file format. Please upload mp4, mov, mkv, avi, webm.";
    }
    const sizeMB = f.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return `File too large. Max allowed: ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFileReady(f);
    },
    [onFileReady]
  );

  const openPicker = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${dragActive ? styles.active : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={onDrop}
        onClick={openPicker}
      >
        {/* Glow frame */}
        <div className={styles.glowFrame}></div>

        {/* Cinematic placeholder background */}
        <div className={styles.placeholderImage}></div>

        {/* Upload Icon */}
        <div className={styles.centerIcon}>
          <span className="material-symbols-outlined">upload</span>
        </div>

        {/* Upload text */}
        <div className={styles.textBlock}>
          <h2>Drag & Drop to Upload</h2>
          <p>or click to browse your files</p>
        </div>

        {/* Hidden input */}
        <input
          type="file"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}
