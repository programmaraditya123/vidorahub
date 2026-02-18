"use client";

import { useState } from "react";
import KineticPlayerPreview from "@/src/components/upload/KineticPlayerPreview/KineticPlayerPreview";
import VisualCarousel from "@/src/components/upload/VisualCarousel/VisualCarousel";
import styles from "../../../app/uploadvideo/UploadPage.module.scss";
import DataSculptingForm from "@/src/components/upload/DataScluptingForm/DataSculptingForm";
import UploadVideo from "@/src/components/uploadvideo/UploadVideo";
import { extractThreeFramesAsItems } from "@/src/utils/extractFrames";
import { uploadVideoFlow } from "@/src/lib/video/uploadvideo";
import { useToast } from "@/src/hooks/ui/ToastProvider/ToastProvider";
import { useRouter } from "next/navigation";
import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";




export default function UploadVibePage() {
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [frames, setFrames] = useState<any[]>([]);

  const router = useRouter()

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const { success, error, info } = useToast();

    
  const startUpload = async (
    formData: { title: string; description: string; tags: string[] },
    isDraft: boolean
  ) => {
    if (!file) return info("No video selected!");

    const selectedThumb = frames.find((f) => f.isCurrent);
    if (!selectedThumb) return info("Select a thumbnail!");

    const thumbnailBlob = await (await fetch(selectedThumb.src)).blob();
    const thumbnailFile = new File([thumbnailBlob], "thumbnail.png", {
      type: "image/png",
    });

    const controller = new AbortController();
    setAbortController(controller);

    setIsUploading(true);
    setProgress(0);

    try {
      await uploadVideoFlow({
        videoFile: file,
        thumbnailFile,
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        category: "general",
        visibility: "public",
        onProgress: (p: number) => setProgress(p),
        contentType : "vibe",
      });

      setIsUploading(false);
      success("Video uploaded successfully!");
      router.replace("/profile");
    } catch (err: any) {
      setIsUploading(false);

      if (err?.name === "CanceledError") {
        error("Upload cancelled.");
      } else {
        console.error(err);
        error("Upload failed.");
      }
    }
  };

  const handlePublish = (data: any) => startUpload(data, false);
  const handleSaveDraft = (data: any) => startUpload(data, true);

  return (
    <div className={styles.page}>

      {/* <div className={styles.hiddenSideBar}> */}
        <Sidebar />
      {/* </div> */}


      {isUploading && (
        <div className={styles.uploadOverlay}>
          <div className={styles.progressBox}>
            <h3>Uploading Vibe...</h3>
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
      
      {!file && (
          <div className={styles.overlay}>
            <UploadVideo
              onFileReady={async (f) => {
                setFile(f);
                setVideoPreview(URL.createObjectURL(f));

                const extracted = await extractThreeFramesAsItems(f);
                setFrames(extracted);
              }}
              variant = "vibe"
            />
          </div>
        )}
        
      <div className={styles.leftdiv}>
        

        {file && <KineticPlayerPreview src={videoPreview} />}

        {file && frames.length > 0 && (
          <VisualCarousel
            frames={frames}
            onSelect={(id, src) => {
              setFrames(prev => {
                // custom upload
                if (src) {
                  return [
                    ...prev.map(f => ({ ...f, isCurrent: false })),
                    { id, src, isCurrent: true },
                  ];
                }

                // selecting existing frame
                return prev.map(f => ({ ...f, isCurrent: f.id === id }));
              });
            }}

            onDelete={(id) => {
              setFrames(prev => prev.filter(f => f.id !== id));
            }}
          />
        )}
      </div>

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
