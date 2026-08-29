export type SourceType = "YOUTUBE" | "GCS" | "VIDORAHUB";
export type JobStatus =
  | "QUEUED"
  | "VALIDATING"
  | "DOWNLOADING"
  | "EXTRACTING_AUDIO"
  | "TRANSCRIBING"
  | "ANALYZING"
  | "DETECTING_VIBES"
  | "GENERATING_VIBES"
  | "FINALIZING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type VibeJob = {
  _id: string;
  source_type: SourceType;
  source_url: string;
  source_identifier: string;
  status: JobStatus;
  progress: number;
  current_stage: JobStatus;
  error?: { code: string; message: string; details?: unknown } | null;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
};

export type Vibe = {
  _id: string;
  job_id: string;
  source_type: SourceType;
  start_time: number;
  end_time: number;
  duration: number;
  title: string;
  hook: string;
  description?: string | null;
  vibe_score: number;
  status: "DRAFT" | "RENDERING" | "READY" | "FAILED" | "PUBLISHED";
  video_url?: string | null;
  thumbnail_url?: string | null;
};

export type ApiError = { code: string; message: string; details?: unknown };
export type ApiResponse<T> = { success: boolean; data: T | null; error: ApiError | null };
