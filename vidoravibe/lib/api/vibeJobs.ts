import { apiRequest } from "./client";
import type { Vibe, VibeJob } from "./types";
export type ClipOptions = { min_seconds: number; max_seconds: number; clip_count: number; captions: boolean; reframe: boolean; focus: string };
export function createVibeJob(source: { source_url: string } | { upload_id: string }, options: ClipOptions, key: string) {
  return apiRequest<{ job: VibeJob; duplicate: boolean }>("/api/v1/vibe-jobs", {
    method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify({ ...source, ...options }),
  }, 60000);
}
export function getVibeJob(jobId: string) { return apiRequest<VibeJob>(`/api/v1/vibe-jobs/${jobId}`); }
export function cancelVibeJob(jobId: string) { return apiRequest<VibeJob>(`/api/v1/vibe-jobs/${jobId}/cancel`, { method: "POST" }); }
export function getJobVibes(jobId: string) { return apiRequest<{ vibes: Vibe[] }>(`/api/v1/vibe-jobs/${jobId}/vibes`); }
export function listJobs(before?: string) { return apiRequest<{ jobs: VibeJob[]; next_cursor: string | null }>(`/api/v1/vibe-jobs${before ? `?before=${encodeURIComponent(before)}` : ""}`); }

export async function uploadVideo(file: File, progress: (percent: number) => void, signal: AbortSignal) {
  const session = await apiRequest<{ upload_id: string; upload_url: string; chunk_bytes: number }>("/api/v1/uploads", {
    method: "POST", body: JSON.stringify({ filename: file.name, size: file.size, content_type: file.type || "video/mp4" }),
  }, 60000);
  let offset = 0, stalls = 0;
  while (offset < file.size) {
    signal.throwIfAborted();
    const previousOffset = offset;
    const end = Math.min(offset + session.chunk_bytes, file.size);
    let complete = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const response = await fetch(session.upload_url, { method: "PUT", signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]),
          headers: { "Content-Range": `bytes ${offset}-${end - 1}/${file.size}`, "Content-Type": file.type || "video/mp4" },
          body: file.slice(offset, end),
        });
        if (response.ok) { offset = file.size; complete = true; break; }
        if (response.status === 308) {
          const range = response.headers.get("Range");
          if (!range) throw new Error("Upload progress header is missing. Check bucket CORS configuration.");
          offset = Number(range.split("-")[1]) + 1;
          complete = true; break;
        }
        if (response.status < 500 && response.status !== 429) throw new Error("Upload session expired or was rejected. Please start again.");
        throw new Error("Storage is temporarily unavailable.");
      } catch (error) {
        signal.throwIfAborted();
        if (attempt === 3) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
        // Recover acknowledged offset after ambiguous network failures; never resend blindly.
        const status = await fetch(session.upload_url, { method: "PUT", signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]),
          headers: { "Content-Range": `bytes */${file.size}` }, body: new Blob([]) });
        if (status.ok) { offset = file.size; complete = true; break; }
        if (status.status === 308) {
          offset = status.headers.get("Range") ? Number(status.headers.get("Range")!.split("-")[1]) + 1 : 0;
          complete = true; break;
        }
      }
    }
    if (!complete) throw new Error("Upload interrupted. Please try again.");
    stalls = offset <= previousOffset ? stalls + 1 : 0;
    if (stalls >= 4 || !Number.isFinite(offset) || offset > file.size) throw new Error("Upload stopped making progress. Please start again.");
    progress(Math.round(offset / file.size * 100));
  }
  return session.upload_id;
}
