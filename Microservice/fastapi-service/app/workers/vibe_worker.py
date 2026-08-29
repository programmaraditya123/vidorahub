from concurrent.futures import ThreadPoolExecutor

from app.services.jobs.processor import VibeJobProcessor

executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="vibe-worker")


def enqueue_vibe_job(job_id: str) -> None:
    executor.submit(VibeJobProcessor().process, job_id)
