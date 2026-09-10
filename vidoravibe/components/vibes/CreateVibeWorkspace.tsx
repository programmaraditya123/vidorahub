"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { createVibeJob, uploadVideo, listJobs, type ClipOptions } from "@/lib/api/vibeJobs";
import type { VibeJob } from "@/lib/api/types";
import { detectSource } from "@/lib/vibes/source";

const defaults: ClipOptions = { min_seconds: 25, max_seconds: 60, clip_count: 5, captions: true, reframe: true, focus: "" };
export function CreateVibeWorkspace() {
  const router = useRouter();
  const [tab, setTab] = useState<"link" | "upload">("link");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState(defaults);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<VibeJob[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const request = useRef<{ fingerprint: string; key: string; uploadId?: string } | null>(null);
  useEffect(() => {
    let active = true;
    listJobs().then(result => { if (active) { setJobs(result.jobs); setCursor(result.next_cursor); } })
      .catch(err => { if (active) setHistoryError(err instanceof Error ? err.message : "Could not load your videos."); });
    return () => { active = false; abort.current?.abort(); };
  }, []);
  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try { const result = await listJobs(cursor); setJobs(previous => [...previous, ...result.jobs]); setCursor(result.next_cursor); }
    catch (err) { setHistoryError(err instanceof Error ? err.message : "Could not load more videos."); }
    finally { setLoadingMore(false); }
  }
  async function submit() {
    if (busy) return;
    setError("");
    if (options.min_seconds > options.max_seconds) { setError("Minimum length must be less than or equal to maximum length."); return; }
    if (tab === "link" && !detectSource(url)) { setError("Paste a public or signed HTTPS Google Cloud Storage video URL."); return; }
    if (tab === "upload" && !file) { setError("Choose a video first."); return; }
    const fingerprint = JSON.stringify({ tab, url, file: file && [file.name, file.size, file.lastModified], options });
    if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() };
    const pending = request.current!;
    setBusy(true);
    abort.current = new AbortController();
    try {
      if (tab === "upload" && file && !pending.uploadId) {
        setProgress(0);
        pending.uploadId = await uploadVideo(file, setProgress, abort.current.signal);
      }
      const source = tab === "upload" ? { upload_id: pending.uploadId! } : { source_url: url.trim() };
      const result = await createVibeJob(source, options, pending.key);
      router.push(`/vibes/jobs/${result.job._id}`);
    } catch (err) { setError(abort.current.signal.aborted ? "Upload cancelled." : err instanceof Error ? err.message : "Could not create clips."); }
    finally { setBusy(false); setProgress(null); }
  }
  const field = "mt-2 min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-teal-600 focus:outline-2 focus:outline-teal-100";
  return <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
    <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
      <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">VidoraVibe / Creator workspace</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Long story. <span className="text-teal-700">Great shorts.</span></h1>
      <p className="mt-4 max-w-xl leading-7 text-zinc-600">Find the moments worth sharing. Turn your video into focused, captioned clips that make sense on their own.</p></div>
      <span className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">25–60 seconds · 9:16 video</span>
    </header>
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex gap-2" role="group" aria-label="Video source">
          {(["link", "upload"] as const).map(t => <button key={t} disabled={busy} aria-pressed={tab === t} onClick={() => setTab(t)} className={`rounded-lg px-5 py-3 text-sm font-semibold ${tab === t ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600"}`}>{t === "link" ? "Paste a cloud link" : "Upload a video"}</button>)}
        </div>
        {tab === "link" ? <label className="block text-sm font-semibold">Google Cloud video URL<input className={field + " min-h-14"} value={url} onChange={e => setUrl(e.target.value)} disabled={busy} placeholder="https://storage.googleapis.com/your-bucket/video.mp4" /><span className="mt-3 block text-xs font-normal leading-5 text-zinc-500">Use a public or unexpired signed link. Private videos can be uploaded directly below.</span></label> :
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 p-6 text-center"><span className="mb-2 text-3xl text-teal-700" aria-hidden>&#8593;</span><span className="font-semibold">{file ? file.name : "Choose your long-form video"}</span><span className="mt-2 text-xs text-zinc-500">MP4, MOV, WebM or MKV · up to 2 GB by default</span><input type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/mpeg,.mkv" disabled={busy} className="mt-4 max-w-full text-sm" onChange={e => { setFile(e.target.files?.[0] ?? null); request.current = null; }} /></label>}
        <fieldset disabled={busy} className="mt-8 border-t border-zinc-100 pt-6"><legend className="pt-6 text-sm font-semibold">Make it yours</legend>
          <div className="grid grid-cols-3 gap-4">{([['min_seconds', 'Min seconds', 25, 60], ['max_seconds', 'Max seconds', 25, 60], ['clip_count', 'Clips', 1, 12]] as const).map(([key, label, min, max]) => <label key={key} className="text-xs font-medium text-zinc-600">{label}<input type="number" min={min} max={max} value={options[key]} className={field} onChange={e => setOptions({ ...options, [key]: Number(e.target.value) })} /></label>)}</div>
          <label className="mt-5 block text-sm font-medium">What should we look for? <span className="font-normal text-zinc-400">Optional</span><textarea className={field + " min-h-22 py-3"} maxLength={500} value={options.focus} onChange={e => setOptions({ ...options, focus: e.target.value })} placeholder="e.g. Practical advice, surprising lessons, or the best explanation" /></label>
          <div className="mt-5 flex flex-wrap gap-5 text-sm">{([['captions', 'Burn in captions'], ['reframe', 'Follow faces']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2"><input className="size-4 accent-teal-700" type="checkbox" checked={options[key]} onChange={e => setOptions({ ...options, [key]: e.target.checked })} />{label}</label>)}</div>
        </fieldset>
        {progress !== null && <div className="mt-6" role="status"><div className="mb-2 flex justify-between text-sm"><span>{progress === 100 ? "Preparing your video…" : "Uploading securely…"}</span><span>{progress}%</span></div><progress max={100} value={progress} className="h-2 w-full accent-teal-600" /></div>}
        {error && <p role="alert" className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-7 flex gap-3"><button disabled={busy} onClick={submit} className="min-h-13 flex-1 rounded-xl bg-teal-700 px-6 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50">{busy ? progress !== null && progress < 100 ? "Uploading your video…" : "Creating your clips…" : "Find my best moments"}</button>{busy && progress !== null && progress < 100 && <button onClick={() => abort.current?.abort()} className="px-3 text-sm underline">Cancel</button>}</div>
      </section>
      <aside className="space-y-5"><div className="rounded-2xl bg-zinc-950 p-7 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-teal-300">From one video to more</p><h2 className="mt-4 text-2xl font-semibold">Give every good moment its own stage.</h2><ol className="mt-7 space-y-6 text-sm">{['Understand the conversation', 'Find a complete, compelling moment', 'Frame, caption, and export'].map((text, i) => <li key={text} className="flex items-start gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-teal-300">{i + 1}</span><span className="pt-0.5 text-zinc-300">{text}</span></li>)}</ol></div><p className="px-2 text-xs leading-6 text-zinc-500">Your clips stay private. Preview each result, adjust its timing, and download when it feels right. Only upload videos you have permission to use.</p></aside>
    </div>
    <section className="mt-12"><h2 className="text-xl font-semibold">Your recent videos</h2><p className="mt-1 text-sm text-zinc-500">Pick up where you left off.</p>
      {historyError && <p role="alert" className="mt-4 text-sm text-rose-700">{historyError}</p>}
      {!jobs.length && !historyError && <div className="mt-5 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">Your videos will appear here once you create your first clips.</div>}
      <div className="mt-5 grid gap-3">{jobs.map(job => <Link href={`/vibes/jobs/${job._id}`} key={job._id} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-teal-400"><div className="min-w-0"><p className="truncate text-sm font-semibold">{job.source_url.split('/').pop() || "Cloud video"}</p><p className="mt-1 text-xs text-zinc-500">{new Date(job.created_at).toLocaleDateString()} · {job.source_type}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${job.status === "COMPLETED" ? "bg-teal-50 text-teal-800" : job.status === "FAILED" ? "bg-rose-50 text-rose-700" : "bg-zinc-100 text-zinc-600"}`}>{job.status.replaceAll("_", " ").toLowerCase()} {!["COMPLETED", "FAILED", "CANCELLED"].includes(job.status) && `${job.progress}%`}</span></Link>)}</div>
      {cursor && <button disabled={loadingMore} onClick={loadMore} className="mt-5 text-sm font-semibold text-teal-700">{loadingMore ? "Loading…" : "Load more videos"}</button>}
    </section>
  </main>;
}
