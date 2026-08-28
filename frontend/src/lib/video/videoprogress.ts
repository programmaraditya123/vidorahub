import { http } from "../http";

export type VideoProgressRecord = {
  profileId: string;
  videoId: string;
  position: number;
  duration: number | null;
  percent: number;
  isCompleted: boolean;
  lastPlayedAt?: string;
  playbackSpeed?: number;
  muted?: boolean;
};

type GetVideoProgressResponse = {
  success: boolean;
  exists?: boolean;
  data: VideoProgressRecord | null;
};

type SendVideoProgressPayload = {
  profileId: string;
  videoId: string;
  position: number;
  duration?: number | null;
  clientProgressAt: number;
  playbackSpeed?: number;
  muted?: boolean;
};

type SendVideoProgressResponse = {
  success: boolean;
  updated?: boolean;
  data: VideoProgressRecord | null;
};

export async function getVideoProgress(profileId: string, videoId: string) {
  const response = await http.get<GetVideoProgressResponse>("/api/v1/getVideoProgress", {
    params: { profileId, videoId },
  });

  return response.data;
}

export async function sendVideoProgress(payload: SendVideoProgressPayload) {
  const response = await http.post<SendVideoProgressResponse>(
    "/api/v1/sendVideoProgress",
    payload,
  );

  return response.data;
}
