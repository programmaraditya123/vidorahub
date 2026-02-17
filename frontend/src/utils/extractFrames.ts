export function extractFrame(video: HTMLVideoElement, time: number): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;

    const handleSeeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg"));
      video.removeEventListener("seeked", handleSeeked);
    };

    video.addEventListener("seeked", handleSeeked);
    video.currentTime = time;
  });
}

export async function extractThreeFramesAsItems(file: File) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.crossOrigin = "anonymous";

  return new Promise<any[]>((resolve) => {
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const times = [
        duration * 0.1,
        duration * 0.5,
        duration * 0.9,
      ];

      const frames: any[] = [];

      let index = 1;
      for (const t of times) {
        const src = await extractFrame(video, t);
        frames.push({
          id: index.toString(),
          src,
          isCurrent: index === 1,  
        });
        index++;
      }

      resolve(frames);
    };
  });
}


export function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "00:00";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }

  return `${m}:${s.toString().padStart(2, "0")}`;
}



export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => reject("Failed to load video metadata");

    video.src = URL.createObjectURL(file);
  });
}
