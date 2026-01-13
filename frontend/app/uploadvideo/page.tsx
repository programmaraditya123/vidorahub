"use client";

import { useState } from "react";
import KineticPlayerPreview from "@/src/components/upload/KineticPlayerPreview/KineticPlayerPreview";
import VisualCarousel from "@/src/components/upload/VisualCarousel/VisualCarousel";
import styles from "./UploadPage.module.scss";
import DataSculptingForm from "@/src/components/upload/DataScluptingForm/DataSculptingForm";
import VaultResourceCard from "@/src/components/upload/RightSideBar/VaultResourceCard";
import UploadVideo from "@/src/components/uploadvideo/UploadVideo";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const frames = [
    { id: "current", src: "/demo/frame1.jpg", isCurrent: true },
    { id: "2", src: "/demo/frame2.jpg" },
    { id: "3", src: "/demo/frame3.jpg" },
  ];

  return (
    <div className={styles.page}>
      {/* LEFT COLUMN */}
      <div className={styles.leftdiv}>

        {/* OVERLAY that is centered */}
        {!file && (
          <div className={styles.overlay}>
            <UploadVideo
              onFileReady={(f) => {
                setFile(f);
                setVideoPreview(URL.createObjectURL(f));
              }}
            />
          </div>
        )}

        {/* Only display player/carousel after upload */}
        {file && <KineticPlayerPreview src={videoPreview} />}
        {file && <VisualCarousel frames={frames} />}
      </div>

      {/* RIGHT COLUMN */}
      {file && (
        <div className={styles.right}>
          <DataSculptingForm
            onPublish={(formData) => {
              console.log("Publishing...", formData, file);
            }}
            onSaveDraft={() => alert("Draft Saved")}
          />

          <VaultResourceCard />
        </div>
      )}
    </div>
  );
}
