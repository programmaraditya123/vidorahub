// import { error } from "console";
import { http } from "../http";


export type UploadResponse = {
    status ?: boolean,
    message ?: string
}

export async function addTranscodeJob(payload: {
  videoId: string;
  inputUrl: string;
  outputPath: string;
  resolutions: string[];
}) {
  const response = await fetch(
    "https://about-vidorahub-ffmpeg-worker.onrender.com/addJobToQueue",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Failed to add transcode job: " + errorText);
  }

  return await response.json();
}


export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => reject("Failed to load video metadata");

    video.src = URL.createObjectURL(file);
  });
}


interface GetVideosParams {
  page?: number;
  limit?: number;
}

export async function getVideos({ page = 1, limit = 20 }: GetVideosParams = {}) {
  const response = await http.get("/api/v1/allvideos", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}





export async function getUploadUrl(file: File, type: "video" | "thumbnail",contentCategory: "video" | "vibe") {
  const { data } = await http.post("/api/v1/get-upload-url", {
    fileName: file.name,
    contentType: file.type,
    type,  
    contentCategory,
  });

  return data; 
}

export async function uploadFileToGCS(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
) {
  await http.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
    timeout: 1000 * 60 * 10, 
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    },
  });
}


export async function saveVideoMetadata(payload: {
  title: string;
  description: string;
  tags: string[];
  category?: string;
  visibility?: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl?: string | null;
  contentType: "video" | "vibe";
}) {
  const { data } = await http.post("/api/v1/uploadvideo", payload, {
    timeout: 1000 * 60 * 2, // 2 minutes is enough
  });
  return data;
}



function buildHlsOutputPath(publicUrl: string): string {
  const marker = "vidorahub/";
  const index = publicUrl.indexOf(marker);

  if (index === -1) {
    throw new Error("Invalid GCS URL format");
  }

  const fullPath = publicUrl.substring(index + marker.length);

  return `hlsvideos/${fullPath}`;
}

export async function uploadVideoFlow({
  videoFile,
  thumbnailFile,
  title,
  description,
  tags,
  category,
  visibility,
   contentType,
  onProgress,
}: {
  videoFile: File;
  thumbnailFile?: File;
  title: string;
  description: string;
  tags: string[];
  category?: string;
  visibility?: string;
  contentType: "video" | "vibe";
  onProgress?: (percent: number) => void;
}) {
  // 1. duration
  const duration = await getVideoDuration(videoFile);

  // 2. signed url for video
  const videoSigned = await getUploadUrl(videoFile, "video",contentType);

  // 3. upload video
  await uploadFileToGCS(videoSigned.uploadUrl, videoFile, onProgress);

  // 4. signed url for thumbnail (optional)
  let thumbnailUrl: string | null = null;
  if (thumbnailFile) {
    const thumbSigned = await getUploadUrl(thumbnailFile, "thumbnail",contentType);
    await uploadFileToGCS(thumbSigned.uploadUrl, thumbnailFile);
    thumbnailUrl = thumbSigned.publicUrl;
  }

  // 5. save metadata
  const saved = await saveVideoMetadata({
    title,
    description,
    tags,
    category,
    visibility,
    duration,
    videoUrl: videoSigned.publicUrl,
    thumbnailUrl,
    contentType,
  });
  await addTranscodeJob({
  videoId: saved.videoId,
  inputUrl: videoSigned.publicUrl,
  outputPath: buildHlsOutputPath(videoSigned.publicUrl),
  resolutions: ["360p", "480p", "720p", "1080p"],
});
}

