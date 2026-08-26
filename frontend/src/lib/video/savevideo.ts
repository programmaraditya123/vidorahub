import { http } from "../http";

export type SavedVideoItem = {
  _id: string;
  title?: string;
  thumbnailUrl?: string | null;
  duration?: number | string | null;
  contentType?: string;
  uploader?: {
    _id?: string;
    name?: string;
    profilePicUrl?: string;
  } | null;
  isDeleted?: boolean;
  stats?: {
    views?: number;
    likes?: number;
  };
  videoUrl?: string;
  videoSerialNumber?: number;
  createdAt?: string;
  savedVideoId?: string;
  savedAt?: string;
};

export type SaveVideoStatusResponse = {
  success: boolean;
  data: {
    videoId: string;
    isSaved: boolean;
    savedAt: string | null;
    savedVideoId: string | null;
  };
};

export type SaveVideoMutationResponse = {
  success: boolean;
  alreadySaved?: boolean;
  alreadyUnsaved?: boolean;
  message?: string;
  data?: {
    videoId?: string;
    isSaved?: boolean;
    savedAt?: string;
    savedVideoId?: string;
  };
};

export type AllSavedVideosResponse = {
  success: boolean;
  data: {
    savedVideos: SavedVideoItem[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type GetSavedVideosParams = {
  page?: number;
  limit?: number;
};

export async function saveVideo(videoId: string) {
  const { data } = await http.post<SaveVideoMutationResponse>("/api/v1/saveVideo", {
    videoId,
  });

  return data;
}

export async function unsaveVideo(videoId: string) {
  const { data } = await http.delete<SaveVideoMutationResponse>("/api/v1/saveVideo", {
    data: { videoId },
  });

  return data;
}

export async function getSaveVideoStatus(videoId: string) {
  const { data } = await http.get<SaveVideoStatusResponse>("/api/v1/saveVideoStatus", {
    params: { videoId },
  });

  return data;
}

export async function getAllSavedVideos({
  page = 1,
  limit = 20,
}: GetSavedVideosParams = {}) {
  const { data } = await http.get<AllSavedVideosResponse>("/api/v1/allSavedVideo", {
    params: { page, limit },
  });

  return data;
}
