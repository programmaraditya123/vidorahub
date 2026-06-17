import { http } from './client';
import RNFS from 'react-native-fs';
import type {
  AuthResponse,
  ProfileData,
  VideoItem,
  PaginatedVideosResponse,
  VibeItem,
  Comment,
  ApiProduct,
  EarningsData,
  UploadMetadataPayload,
} from '@/types';

export type RegisterPayload = {
  email: string;
  name: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function userRegister(payload: RegisterPayload) {
  const { data } = await http.post<AuthResponse>('api/v1/register', payload);
  return data;
}

export async function userLogin(payload: LoginPayload) {
  const { data } = await http.post<AuthResponse>('/api/v1/userlogin', payload);
  return data;
}

export async function googleLogin(token: string) {
  const { data } = await http.post<AuthResponse>('api/v1/google-login', { token });
  return data;
}

export async function getVideos(page = 1, limit = 20) {
  const { data } = await http.get<PaginatedVideosResponse>(
    '/api/v1/allvideos',
    { params: { page, limit } },
  );
  return data;
}

export async function getNextVideos(params: {
  videoId?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { data } = await http.get('/api/v1/getNextVideos', {
    params: {
      excludeVideoId: params.videoId,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search ?? '',
    },
  });
  return data;
}

export async function getVideoMetadata(videoId: string) {
  const { data } = await http.get(
    `api/v1/getVedioDataExceptCommentsDocs/${videoId}`,
  );
  return data;
}

export async function getCreatorProfile() {
  const { data } = await http.get<{ success: boolean; data: ProfileData }>(
    '/api/v1/creatorProfile',
  );
  return data;
}

export async function getCreatorChannel(objectId: string) {
  const { data } = await http.get<{ success: boolean; data: ProfileData }>(
    `/api/v1/creatorchannel/${objectId}`,
  );
  return data;
}

export async function deleteVideo(videoId: string) {
  const { data } = await http.put('/api/v1/deletevideo', { videoId });
  return data;
}

export async function postView(payload: {
  videoId: string;
  sessionId: string;
  watchTime: number;
}) {
  const { data } = await http.post('/api/v1/views', payload);
  return data;
}

export async function getVibes(limit = 5, cursor?: string) {
  const { data } = await http.get<{
    success: boolean;
    data: VibeItem[];
    nextCursor?: string;
  }>('/api/v1/allvibes', { params: { limit, cursor } });
  return data;
}

export async function getComments(videoId: string, page = 1, limit = 20) {
  const { data } = await http.get<{ data: Comment[] }>(
    `/api/v1/getVedioComments/${videoId}?page=${page}&limit=${limit}`,
  );
  return data;
}

export async function postComment(videoId: string, content: string) {
  const { data } = await http.post(`/api/v1/postVedioComments/${videoId}`, {
    content,
  });
  return data;
}

export async function getEarnings() {
  const { data } = await http.get<EarningsData & { data?: EarningsData }>(
    '/api/v1/getEarnings',
  );
  return (data?.data ?? data) as EarningsData;
}

export async function getAllProducts(creatorId: string) {
  const { data } = await http.get<{
    success: boolean;
    count: number;
    products: ApiProduct[];
  }>(`/api/v1/allProducts/${creatorId}`);
  return data;
}

export async function getUploadUrl(
  fileName: string,
  contentType: string,
  type: 'video' | 'thumbnail',
  contentCategory: 'video' | 'vibe',
) {
  const { data } = await http.post<{
    uploadUrl: string;
    publicUrl: string;
  }>('/api/v1/get-upload-url', {
    fileName,
    contentType,
    type,
    contentCategory,
  });
  return data;
}

export async function uploadFileToGCS(
  uploadUrl: string,
  uri: string,
  contentType: string,
  onProgress?: (percent: number) => void,
) {
  const filePath = decodeURIComponent(uri.replace('file://', ''));
  const fileName = filePath.split(/[\\/]/).pop() ?? 'upload';

  const result = await RNFS.uploadFiles({
    toUrl: uploadUrl,
    method: 'PUT',
    binaryStreamOnly: true,
    headers: {
      'Content-Type': contentType,
    },
    files: [
      {
        name: 'file',
        filename: fileName,
        filepath: filePath,
        filetype: contentType,
      },
    ],
    progress: (event) => {
      if (!onProgress || event.totalBytesExpectedToSend <= 0) return;
      onProgress(
        Math.round((event.totalBytesSent / event.totalBytesExpectedToSend) * 100),
      );
    },
  }).promise;

  if (result.statusCode < 200 || result.statusCode >= 300) {
    throw new Error(`Upload failed: ${result.statusCode}`);
  }

  onProgress?.(100);
}

export async function saveVideoMetadata(payload: UploadMetadataPayload) {
  const { data } = await http.post<{ videoId: string }>(
    '/api/v1/uploadvideo',
    payload,
    { timeout: 120000 },
  );
  return data;
}

export async function addTranscodeJob(payload: {
  videoId: string;
  inputUrl: string;
  outputPath: string;
  resolutions: string[];
}) {
  const { config: appConfig } = await import('@/config');
  const response = await fetch(`${appConfig.ffmpegWorkerUrl}/addJobToQueue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add transcode job: ${errorText}`);
  }

  return response.json();
}
