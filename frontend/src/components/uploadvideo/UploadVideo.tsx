"use client";
import React, { useState, useRef, useCallback } from "react";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import styles from "./UploadVideo.module.scss";

const ALLOWED_VIDEO_TYPES = [
  // MP4
  "video/mp4",
  "application/mp4",

  // WebM
  "video/webm",

  // MOV (QuickTime)
  "video/quicktime",

  // MKV (Matroska)
  "video/x-matroska",
  "video/matroska",
  "video/mkv",

  // AVI
  "video/x-msvideo",
  "video/avi",

  // MPEG
  "video/mpeg",
  "video/mpg",

  // 3GP
  "video/3gpp",
  "video/3gpp2",

  // OGG
  "video/ogg",

  // M4V
  "video/x-m4v",
  "video/m4v",

  // TS (Transport Stream)
  "video/mp2t",

  // FLV
  "video/x-flv",

  // WMV
  "video/x-ms-wmv",

  // HEVC / H265 (sometimes reported)
  "video/hevc",
  "video/h265"
];
type Props = {
  onFileReady?: (file: File) => void;
  variant?: "vibe";
};

const MAX_SIZE_MB = 2048;

export default function UploadVideo({ onFileReady, variant }: Props) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleInputRef = useRef<HTMLInputElement | null>(null);
//   const [title, setTitle] = useState<string | null>("");
//   const [description, setDiscription] = useState<string | null>("");
//   const [tags, setTags] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(false);

  //check selected file
  const validateFile = (f: File) => {
      
    if (!ALLOWED_VIDEO_TYPES.includes(f.type)) {
      return "Unsupported file format.Please Upload Video (mp4,mov,mkv)";
    }
    const sizeMB = f.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return `File is too large.Max Allowed is ${MAX_SIZE_MB}MB`;
    }
  
    return;
  };

  //function called when user picked or dropped file
  const handlefile = useCallback((f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
    onFileReady?.(f);
  }, []);

  //Drag and drop handling functions
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dt = e.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;
    const f = dt.files[0];
    handlefile(f);
  };

  //function to open computer files and folders
  const openPicker = () => handleInputRef.current?.click();

  //enter/space trigger to open file picker
  const onDropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  //handle hidden input change
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handlefile(f);
    e.currentTarget.value = "";
  };

  return (
    // <div className={styles.topcontainer}>
    <div className={styles.innercontainer}>
      {/* // <div className={`${styles.upload} ${dragActive ? styles.dragActive : ""}`} > */}

      <h1 className={styles.toptext}>
        {variant === "vibe" ? "Upload Your Vibe" : "Upload Your Video"}
      </h1>

      <div
        className={styles.upload}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={openPicker}
        onKeyDown={onDropKeyDown}
      >
        <div className={styles.uploadicon}>
          <VidorahubIcon.FileIcon />
        </div>
        <div className={styles.uploadtext}>
          Drag & Drop your video file here
        </div>
        <div className={styles.uploadtext2}>or click to browse</div>
        <button
          className={styles.selectbtn}
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
        >
          Select file
        </button>
        <input
          ref={handleInputRef}
          type="file"
          onChange={onInputChange}
          style={{ display: "none" }}
        />
        <div style={{ marginTop: 12 }}>
          {error && <div style={{ color: "red" }}>{error}</div>}
          {file && (
            <div>
              <strong>Selected:</strong> {file.name} —{" "}
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          )}
        </div>
      </div>
    </div>
    // </div>
  );
}
