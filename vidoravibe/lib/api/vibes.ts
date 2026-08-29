import { apiRequest } from "./client";
import type { Vibe } from "./types";

export function getVibe(vibeId: string) {
  return apiRequest<Vibe>(`/api/v1/vibes/${vibeId}`);
}

export function updateVibe(vibeId: string, payload: Partial<Pick<Vibe, "start_time" | "end_time" | "title">>) {
  return apiRequest<Vibe>(`/api/v1/vibes/${vibeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getVibeDownload(vibeId: string) {
  return apiRequest<{ download_url: string; expires_in_seconds: number }>(`/api/v1/vibes/${vibeId}/download`);
}
