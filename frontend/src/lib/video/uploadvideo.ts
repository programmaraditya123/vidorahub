import { error } from "console";
import { http } from "../http";


// export type UploadPayload = {
//     file : File,
//     title : string,
//     description : string,
//     tags : string
// }



export type UploadResponse = {
    status ?: boolean,
    message ?: string
}

// export async function uploadVideo(payload:UploadPayload){
//     const form = new FormData();
//     form.append("video",payload.file)
//     form.append("title",payload.title)
//     form.append("description",payload.description)
//     form.append("tags",payload.tags)
//     const {data} = await http.post<UploadResponse>("api/v1/uploadvideo",form,
//         {
//             headers:{
//                 "Content-Type":"multipart/form-data"
//             }
//         }
//     )
//     return data;
// }


export type UploadPayload = {
  video: File;
  thumbnail?: File | null;
  title: string;
  description: string;
  tags: string[];
  visibility?: "public" | "private" | "unlisted";
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
  form.append("visibility", payload.visibility || "private");   // ALWAYS private
  form.append("category", payload.category || "general");

  const { data } = await http.post("/api/v1/uploadvideo", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
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






export async function getVideos(){
    const video = await http.get("api/v1/allvideos")
    // if(!video?.ok){
    //     throw new Error("Failed to fetch videos")
    // }
    // const data = await video.json()
    return video
}