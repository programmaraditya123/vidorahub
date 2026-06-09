import { useMutation } from '@tanstack/react-query';
import {
  userLogin,
  userRegister,
  googleLogin,
  saveVideoMetadata,
  getUploadUrl,
  uploadFileToGCS,
  addTranscodeJob,
} from '@/services/api/authApi';
import { useAuthStore } from '@/store/authStore';
import type { LoginPayload, RegisterPayload } from '@/services/api/authApi';
import type { UploadMetadataPayload } from '@/types';

export function useLoginMutation() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: (payload: LoginPayload) => userLogin(payload),
    onSuccess: async (data) => {
      if (data.success && data.token && data.user) {
        await login(data.token, {
          name: data.user.name,
          email: data.user.email,
          userSerialNumber: data.user.userSerialNumber,
        });
      }
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => userRegister(payload),
  });
}

export function useGoogleLoginMutation() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: (token: string) => googleLogin(token),
    onSuccess: async (data) => {
      if (data.success && data.token && data.user) {
        await login(data.token, {
          name: data.user.name,
          email: data.user.email,
          userSerialNumber: data.user.userSerialNumber,
        });
      }
    },
  });
}

function buildHlsOutputPath(publicUrl: string): string {
  const marker = 'vidorahub/';
  const index = publicUrl.indexOf(marker);
  if (index === -1) throw new Error('Invalid GCS URL format');
  const fullPath = publicUrl.substring(index + marker.length);
  return `hlsvideos/${fullPath}`;
}

export function useUploadVideoMutation() {
  return useMutation({
    mutationFn: async (params: {
      videoUri: string;
      videoFileName: string;
      videoContentType: string;
      thumbnailUri?: string;
      thumbnailFileName?: string;
      thumbnailContentType?: string;
      metadata: Omit<UploadMetadataPayload, 'duration' | 'videoUrl' | 'thumbnailUrl'>;
      duration: number;
      onProgress?: (percent: number) => void;
    }) => {
      const videoSigned = await getUploadUrl(
        params.videoFileName,
        params.videoContentType,
        'video',
        params.metadata.contentType,
      );

      await uploadFileToGCS(
        videoSigned.uploadUrl,
        params.videoUri,
        params.videoContentType,
        params.onProgress,
      );

      let thumbnailUrl: string | null = null;
      if (params.thumbnailUri && params.thumbnailFileName && params.thumbnailContentType) {
        const thumbSigned = await getUploadUrl(
          params.thumbnailFileName,
          params.thumbnailContentType,
          'thumbnail',
          params.metadata.contentType,
        );
        await uploadFileToGCS(
          thumbSigned.uploadUrl,
          params.thumbnailUri,
          params.thumbnailContentType,
        );
        thumbnailUrl = thumbSigned.publicUrl;
      }

      const saved = await saveVideoMetadata({
        ...params.metadata,
        duration: params.duration,
        videoUrl: videoSigned.publicUrl,
        thumbnailUrl,
      });

      await addTranscodeJob({
        videoId: saved.videoId,
        inputUrl: videoSigned.publicUrl,
        outputPath: buildHlsOutputPath(videoSigned.publicUrl),
        resolutions: ['360p', '480p', '720p', '1080p'],
      });

      return saved;
    },
  });
}
