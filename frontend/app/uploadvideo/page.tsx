"use client";

import { useState } from "react";
import KineticPlayerPreview from "@/src/components/upload/KineticPlayerPreview/KineticPlayerPreview";
import VisualCarousel from "@/src/components/upload/VisualCarousel/VisualCarousel";
import styles from "./UploadPage.module.scss";
import DataSculptingForm from "@/src/components/upload/DataScluptingForm/DataSculptingForm";
import UploadVideo from "@/src/components/uploadvideo/UploadVideo";
import { extractThreeFramesAsItems } from "@/src/utils/extractFrames";
import { uploadVideo } from "@/src/lib/video/uploadvideo";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [frames, setFrames] = useState<any[]>([]);

  // Upload UI state
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const startUpload = async (formData: { title: string; description: string; tags: string[] }, isDraft: boolean) => {
    if (!file) return alert("No video selected!");

    const selectedThumb = frames.find((f) => f.isCurrent);
    if (!selectedThumb) return alert("Select a thumbnail!");

    // Convert thumbnail base64 → File
    const thumbnailBlob = await (await fetch(selectedThumb.src)).blob();
    const thumbnailFile = new File([thumbnailBlob], "thumbnail.png", { type: "image/png" });

    const controller = new AbortController();
    setAbortController(controller);

    setIsUploading(true);
    setProgress(0);

    const payload = {
      video: file,
      thumbnail: thumbnailFile,
      title: formData.title,
      description: formData.description,
      tags: formData.tags,
      visibility: "private" as const,  
      category: "general",
      cancelToken: controller,
      onProgress: (p: number) => setProgress(p),
    };

    try {
      const res = await uploadVideo(payload);

      setIsUploading(false);
      alert("Video uploaded successfully!");

    } catch (err: any) {
      setIsUploading(false);

      if (err?.name === "CanceledError") {
        alert("Upload cancelled.");
      } else {
        alert("Upload failed.");
      }
    }
  };

  const handlePublish = (data: any) => startUpload(data, false);
  const handleSaveDraft = (data: any) => startUpload(data, true);

  return (
    <div className={styles.page}>
      
      {/* 🔥 Upload Overlay */}
      {isUploading && (
        <div className={styles.uploadOverlay}>
          <div className={styles.progressBox}>
            <h3>Uploading Video...</h3>
            <div className={styles.progressBarOuter}>
              <div className={styles.progressBarInner} style={{ width: `${progress}%` }} />
            </div>
            <p>{progress}%</p>

            <button
              className={styles.cancelBtn}
              onClick={() => abortController?.abort()}
            >
              Cancel Upload
            </button>
          </div>
        </div>
      )}

      {/* Left side */}
      <div className={styles.leftdiv}>
        {!file && (
          <div className={styles.overlay}>
            <UploadVideo
              onFileReady={async (f) => {
                setFile(f);
                setVideoPreview(URL.createObjectURL(f));

                const extracted = await extractThreeFramesAsItems(f);
                setFrames(extracted);
              }}
            />
          </div>
        )}

        {file && <KineticPlayerPreview src={videoPreview} />}

        {file && frames.length > 0 && (
          <VisualCarousel
            frames={frames}
            onSelect={(id, src) => {
              setFrames(prev =>
                prev.map(f => ({ ...f, isCurrent: f.id === id }))
              );
            }}
            onDelete={(id) => {
              setFrames(prev => prev.filter(f => f.id !== id));
            }}
          />
        )}
      </div>

      {/* Right side */}
      {file && (
        <div className={styles.right}>
          <DataSculptingForm
            onPublish={handlePublish}
            onSaveDraft={() => handleSaveDraft}
          />
        </div>
      )}
    </div>
  );
}
