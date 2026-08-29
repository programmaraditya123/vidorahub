from pathlib import Path
from shutil import rmtree


def cleanup_job_directory(path: str | Path) -> None:
    job_path = Path(path)
    if job_path.exists() and job_path.is_dir():
        rmtree(job_path, ignore_errors=True)
