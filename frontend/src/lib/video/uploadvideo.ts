// import { error } from "console";
import { http } from "../http";


export type UploadResponse = {
    status ?: boolean,
    message ?: string
}


type Visibility = "private" | "public" | "unlisted";

export type UploadPayload = {
  video: File;
  thumbnail?: File | null;
  title: string;
  description: string;
  tags: string[];
  visibility?: Visibility;
  category?: string;
  onProgress?: (percent: number) => void;
  cancelToken?: AbortController;
};


export async function uploadVideo(payload: UploadPayload) {
  const form = new FormData();

  form.append("video", payload.video);

  if (payload.thumbnail) form.append("thumbnail", payload.thumbnail);

  form.append("title", payload.title);
  form.append("description", payload.description);
  form.append("tags", payload.tags.join(","));
  form.append("visibility", payload.visibility || "public");   
  form.append("category", payload.category || "general");

  const { data } = await http.post("/api/v1/uploadvideo", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 1000 * 60 * 10,
    signal: payload.cancelToken?.signal,
    onUploadProgress: (ev) => {
      if (payload.onProgress && ev.total) {
        const percent = Math.round((ev.loaded / ev.total) * 100);
        payload.onProgress(percent);
      }
    },
  });

  return data;
}






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
