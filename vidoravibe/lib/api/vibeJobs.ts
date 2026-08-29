import { apiRequest } from "./client";
import type { Vibe, VibeJob } from "./types";

export function createVibeJob(sourceUrl: string) {
  return apiRequest<{ job: VibeJob; duplicate: boolean }>("/api/v1/vibe-jobs", {
    method: "POST",
    body: JSON.stringify({ source_url: sourceUrl }),
  });
}

export function getVibeJob(jobId: string) {
  return apiRequest<VibeJob>(`/api/v1/vibe-jobs/${jobId}`, {}, 10000);
}

export function cancelVibeJob(jobId: string) {
  return apiRequest<VibeJob>(`/api/v1/vibe-jobs/${jobId}/cancel`, { method: "POST" });
}

export function getJobVibes(jobId: string) {
  return apiRequest<{ vibes: Vibe[] }>(`/api/v1/vibe-jobs/${jobId}/vibes`, {}, 10000);
}
