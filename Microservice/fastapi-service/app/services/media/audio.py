from pathlib import Path

from app.services.media.ffmpeg import FFmpegRunner


class AudioExtractor:
    def __init__(self) -> None:
        self.ffmpeg = FFmpegRunner()

    def extract(self, media_path: str, job_dir: str) -> str:
        output = str(Path(job_dir) / "audio.wav")
        self.ffmpeg.run(["-y", "-i", media_path, "-vn", "-ac", "1", "-ar", "16000", output])
        return output
