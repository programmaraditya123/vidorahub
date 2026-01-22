const VIDEO_ID_KEY = "currentVideoId";

export const setVideoId = (videoId: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(VIDEO_ID_KEY, videoId);
};

export const getVideoId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VIDEO_ID_KEY);
};

export const clearVideoId = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VIDEO_ID_KEY);
};
