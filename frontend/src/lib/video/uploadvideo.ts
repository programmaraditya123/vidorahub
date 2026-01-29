// import { error } from "console";
import { http } from "../http";


export type UploadResponse = {
    status ?: boolean,
    message ?: string
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

// type Visibility = "private" | "public" | "unlisted";

// export type UploadPayload = {
//   video: File;
//   thumbnail?: File | null;
//   title: string;
//   description: string;
//   tags: string[];
//   visibility?: Visibility;
//   category?: string;
//   onProgress?: (percent: number) => void;
//   cancelToken?: AbortController;
// };


// export async function uploadVideo(payload: UploadPayload) {
//   const form = new FormData();

//   form.append("video", payload.video);

//   if (payload.thumbnail) form.append("thumbnail", payload.thumbnail);

//   form.append("title", payload.title);
//   form.append("description", payload.description);
//   form.append("tags", payload.tags.join(","));
//   form.append("visibility", payload.visibility || "public");   
//   form.append("category", payload.category || "general");

//   const { data } = await http.post("/api/v1/uploadvideo", form, {
//     headers: {
//       "Content-Type": "multipart/form-data",
//     },
//     timeout: 1000 * 60 * 10,
//     signal: payload.cancelToken?.signal,
//     onUploadProgress: (ev) => {
//       if (payload.onProgress && ev.total) {
//         const percent = Math.round((ev.loaded / ev.total) * 100);
//         payload.onProgress(percent);
//       }
//     },
//   });

//   return data;
// }






// export async function getVideos(){
//     const video = await http.get("api/v1/allvideos")
//     return video
// }

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





export async function getUploadUrl(file: File, type: "video" | "thumbnail") {
  const { data } = await http.post("/api/v1/get-upload-url", {
    fileName: file.name,
    contentType: file.type,
    type,  
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
}) {
  const { data } = await http.post("/api/v1/uploadvideo", payload, {
    timeout: 1000 * 60 * 2, // 2 minutes is enough
  });
  return data;
}



export async function uploadVideoFlow({
  videoFile,
  thumbnailFile,
  title,
  description,
  tags,
  category,
  visibility,
  onProgress,
}: {
  videoFile: File;
  thumbnailFile?: File;
  title: string;
  description: string;
  tags: string[];
  category?: string;
  visibility?: string;
  onProgress?: (percent: number) => void;
}) {
  // 1. duration
  const duration = await getVideoDuration(videoFile);

  // 2. signed url for video
  const videoSigned = await getUploadUrl(videoFile, "video");

  // 3. upload video
  await uploadFileToGCS(videoSigned.uploadUrl, videoFile, onProgress);

  // 4. signed url for thumbnail (optional)
  let thumbnailUrl: string | null = null;
  if (thumbnailFile) {
    const thumbSigned = await getUploadUrl(thumbnailFile, "thumbnail");
    await uploadFileToGCS(thumbSigned.uploadUrl, thumbnailFile);
    thumbnailUrl = thumbSigned.publicUrl;
  }

  // 5. save metadata
  return await saveVideoMetadata({
    title,
    description,
    tags,
    category,
    visibility,
    duration,
    videoUrl: videoSigned.publicUrl,
    thumbnailUrl,
  });
}

